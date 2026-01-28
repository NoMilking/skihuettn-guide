import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { Photo } from '../types';

/**
 * Converts a data URI to Uint8Array
 */
function dataUriToUint8Array(dataUri: string): Uint8Array {
  const base64 = dataUri.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Reads an image from a URI and returns it as Uint8Array (Web version)
 */
async function readImageAsArrayWeb(uri: string): Promise<Uint8Array> {
  // Handle data: URIs directly
  if (uri.startsWith('data:')) {
    console.log('[Photos] Web: Processing data URI...');
    return dataUriToUint8Array(uri);
  }

  // Handle blob: URIs via fetch
  console.log('[Photos] Web: Fetching blob URI...');
  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Uploads a photo for a rating.
 *
 * Process:
 * 1. Compress image to 1200px width (maintains aspect ratio)
 * 2. Upload to Supabase Storage: photos/restaurants/{restaurantId}/{ratingId}_{timestamp}.jpg
 * 3. Save metadata to photos table
 *
 * @param ratingId - The rating UUID
 * @param restaurantId - The restaurant UUID
 * @param uri - Local file URI from image picker
 * @returns Promise<Photo> - The created photo record with storage path
 */
export async function uploadPhoto(
  ratingId: string,
  restaurantId: string,
  uri: string
): Promise<Photo> {
  try {
    let imageUri = uri;
    let contentType = 'image/jpeg';

    // Step 1: Try to compress image (may fail on some platforms)
    if (Platform.OS === 'web') {
      console.log('[Photos] Web: Attempting compression...');
      try {
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        imageUri = compressed.uri;
        console.log('[Photos] Web: Compression successful');
      } catch (compressError) {
        // Compression failed (common on iOS Safari) - use original
        console.warn('[Photos] Web: Compression failed, using original image:', compressError);
        // Keep original URI
      }
    } else {
      // Native: Compression should work
      console.log('[Photos] Native: Compressing image...');
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      imageUri = compressed.uri;
    }

    // Step 2: Create file path
    const timestamp = Date.now();
    const fileName = `${ratingId}_${timestamp}.jpg`;
    const storagePath = `restaurants/${restaurantId}/${fileName}`;

    // Step 3: Read file - platform-specific handling
    console.log('[Photos] Reading file...', { platform: Platform.OS });
    let bytes: Uint8Array;

    if (Platform.OS === 'web') {
      bytes = await readImageAsArrayWeb(imageUri);
      console.log('[Photos] Web: Got bytes:', bytes.length);
    } else {
      // Native: Use expo-file-system
      const base64 = await readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      const binaryString = atob(base64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    }

    // Step 4: Upload to Supabase Storage
    console.log('[Photos] Uploading to storage:', storagePath);
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, bytes.buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Photos] Upload error:', uploadError);
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    // Step 5: Save metadata to database
    const { data, error: dbError } = await supabase
      .from('photos')
      .insert({ rating_id: ratingId, storage_path: storagePath })
      .select()
      .single();

    if (dbError) {
      console.error('[Photos] Database error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('photos').remove([storagePath]);
      throw new Error(`Failed to save photo metadata: ${dbError.message}`);
    }

    console.log('[Photos] Photo uploaded successfully:', data.id);
    return data;
  } catch (error) {
    console.error('[Photos] Upload failed:', error);
    throw error;
  }
}

/**
 * Gets all photos for a rating with like counts.
 * Photos are sorted by like count (descending), then by creation date.
 * Optimized: Uses batch query instead of N+1 individual queries.
 *
 * @param ratingId - The rating UUID
 * @returns Promise<Photo[]> - Array of photos with like_count, sorted by likes
 */
export async function getPhotosByRating(ratingId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('rating_id', ratingId);

  if (error) {
    console.error('[Photos] Error loading photos:', error);
    throw new Error(`Failed to load photos: ${error.message}`);
  }

  if (data.length === 0) return [];

  // Batch query: Get all like counts in one request
  const photoIds = data.map(p => p.id);
  const likeCounts = await getPhotoLikeCountsBatch(photoIds);

  // Merge like counts with photos
  const photosWithLikes = data.map(photo => ({
    ...photo,
    like_count: likeCounts.get(photo.id) ?? 0
  }));

  // Sort by like_count descending, then by created_at
  photosWithLikes.sort((a, b) => {
    if (b.like_count !== a.like_count) {
      return b.like_count - a.like_count;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return photosWithLikes;
}

/**
 * Gets the public URL for a photo.
 *
 * @param storagePath - The storage path from the photos table
 * @returns string - The public URL
 */
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('photos')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Deletes a photo.
 * Removes both the file from storage and the database record.
 *
 * @param photoId - The photo UUID
 * @returns Promise<void>
 */
export async function deletePhoto(photoId: string): Promise<void> {
  try {
    // Step 1: Get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('[Photos] Error fetching photo:', fetchError);
      throw new Error(`Failed to fetch photo: ${fetchError.message}`);
    }

    // Step 2: Delete from storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('[Photos] Error deleting from storage:', storageError);
      // Continue anyway to remove database record
    }

    // Step 3: Delete from database
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('[Photos] Error deleting from database:', dbError);
      throw new Error(`Failed to delete photo: ${dbError.message}`);
    }

    console.log('[Photos] Photo deleted successfully:', photoId);
  } catch (error) {
    console.error('[Photos] Delete failed:', error);
    throw error;
  }
}

/**
 * Deletes all photos for a rating.
 * Used when deleting a rating.
 *
 * @param ratingId - The rating UUID
 * @returns Promise<void>
 */
export async function deletePhotosByRating(ratingId: string): Promise<void> {
  const photos = await getPhotosByRating(ratingId);

  for (const photo of photos) {
    await deletePhoto(photo.id);
  }

  console.log(`[Photos] Deleted ${photos.length} photos for rating ${ratingId}`);
}

/**
 * Toggles a like on a photo.
 * If the user hasn't liked it, adds a like. If already liked, removes the like.
 *
 * @param photoId - The photo UUID
 * @param deviceId - The device UUID
 * @returns Promise<boolean> - true if like was added, false if removed
 */
export async function togglePhotoLike(photoId: string, deviceId: string): Promise<boolean> {
  // Check if user already liked this photo
  const { data: existingLike } = await supabase
    .from('photo_likes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('device_id', deviceId)
    .single();

  if (existingLike) {
    // Remove the like
    const { error } = await supabase
      .from('photo_likes')
      .delete()
      .eq('photo_id', photoId)
      .eq('device_id', deviceId);

    if (error) {
      console.error('[Photos] Error removing like:', error);
      throw new Error(`Failed to remove like: ${error.message}`);
    }

    console.log('[Photos] Like removed for photo:', photoId);
    return false;
  } else {
    // Add a like
    const { error } = await supabase
      .from('photo_likes')
      .insert({ photo_id: photoId, device_id: deviceId });

    if (error) {
      console.error('[Photos] Error adding like:', error);
      throw new Error(`Failed to add like: ${error.message}`);
    }

    console.log('[Photos] Like added for photo:', photoId);
    return true;
  }
}

/**
 * Checks if a user has liked a specific photo.
 *
 * @param photoId - The photo UUID
 * @param deviceId - The device UUID
 * @returns Promise<boolean> - true if user has liked the photo
 */
export async function hasUserLikedPhoto(photoId: string, deviceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('photo_likes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('device_id', deviceId)
    .single();

  return !!data;
}

/**
 * Gets the like count for a photo.
 *
 * @param photoId - The photo UUID
 * @returns Promise<number> - The number of likes
 */
export async function getPhotoLikeCount(photoId: string): Promise<number> {
  const { count, error } = await supabase
    .from('photo_likes')
    .select('*', { count: 'exact', head: true })
    .eq('photo_id', photoId);

  if (error) {
    console.error('[Photos] Error getting like count:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Gets like counts for multiple photos in one batch query.
 * Optimized alternative to calling getPhotoLikeCount for each photo.
 *
 * @param photoIds - Array of photo UUIDs
 * @returns Promise<Map<string, number>> - Map of photoId to like count
 */
export async function getPhotoLikeCountsBatch(photoIds: string[]): Promise<Map<string, number>> {
  if (photoIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('photo_likes')
    .select('photo_id')
    .in('photo_id', photoIds);

  if (error) {
    console.error('[Photos] Error getting like counts batch:', error);
    return new Map();
  }

  // Count likes per photo
  const counts = new Map<string, number>();
  for (const like of data) {
    counts.set(like.photo_id, (counts.get(like.photo_id) ?? 0) + 1);
  }

  return counts;
}

/**
 * Gets all photos for multiple ratings with like counts.
 * Photos are sorted by like count (descending), then by creation date.
 * Optimized: Uses batch query instead of N+1 individual queries.
 *
 * @param ratingIds - Array of rating UUIDs
 * @returns Promise<Photo[]> - Array of photos with like_count, sorted by likes
 */
export async function getPhotosByRatings(ratingIds: string[]): Promise<Photo[]> {
  if (ratingIds.length === 0) return [];

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .in('rating_id', ratingIds);

  if (error) {
    console.error('[Photos] Error loading photos:', error);
    throw new Error(`Failed to load photos: ${error.message}`);
  }

  if (data.length === 0) return [];

  // Batch query: Get all like counts in one request
  const photoIds = data.map(p => p.id);
  const likeCounts = await getPhotoLikeCountsBatch(photoIds);

  // Merge like counts with photos
  const photosWithLikes = data.map(photo => ({
    ...photo,
    like_count: likeCounts.get(photo.id) ?? 0
  }));

  // Sort by like_count descending, then by created_at
  photosWithLikes.sort((a, b) => {
    if ((b.like_count ?? 0) !== (a.like_count ?? 0)) {
      return (b.like_count ?? 0) - (a.like_count ?? 0);
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return photosWithLikes;
}
