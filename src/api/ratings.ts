import { supabase } from './supabase';
import { Rating, CreateRatingInput, UpdateRatingInput } from '../types';

/**
 * Gets all ratings for a specific restaurant.
 * Sorted by creation date (newest first).
 *
 * @param restaurantId - The restaurant UUID
 * @returns Promise<Rating[]> - Array of ratings
 */
export async function getRatingsByRestaurant(restaurantId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[API] Error loading ratings:', error);
    throw new Error(`Failed to load ratings: ${error.message}`);
  }

  return data;
}

/**
 * Gets all ratings by a specific device (user).
 * Sorted by creation date (newest first).
 *
 * @param deviceId - The device UUID
 * @returns Promise<Rating[]> - Array of user's ratings
 */
export async function getRatingsByDevice(deviceId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[API] Error loading user ratings:', error);
    throw new Error(`Failed to load user ratings: ${error.message}`);
  }

  return data;
}

/**
 * Gets all ratings by a specific device (user) WITH restaurant names.
 * Sorted by creation date (newest first).
 *
 * @param deviceId - The device UUID
 * @returns Promise<Array> - Array of user's ratings with restaurant info
 */
export async function getRatingsByDeviceWithRestaurants(deviceId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      restaurants:restaurant_id (
        id,
        name,
        ski_area_id
      )
    `)
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[API] Error loading user ratings with restaurants:', error);
    throw new Error(`Failed to load user ratings: ${error.message}`);
  }

  return data;
}

/**
 * Gets a user's rating for a specific restaurant.
 * Returns null if the user hasn't rated this restaurant yet.
 *
 * @param restaurantId - The restaurant UUID
 * @param deviceId - The device UUID
 * @returns Promise<Rating | null> - The rating or null
 */
export async function getUserRatingForRestaurant(
  restaurantId: string,
  deviceId: string
): Promise<Rating | null> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    console.error('[API] Error loading user rating:', error);
    throw new Error(`Failed to load user rating: ${error.message}`);
  }

  return data;
}

/**
 * Creates a new rating.
 *
 * IMPORTANT: The UNIQUE constraint (restaurant_id, device_id) ensures
 * that a user can only rate a restaurant once. Use updateRating() to modify.
 *
 * @param rating - Rating data (without id and timestamps)
 * @returns Promise<Rating> - The created rating with id and timestamps
 */
export async function createRating(rating: CreateRatingInput): Promise<Rating> {
  const { data, error } = await supabase
    .from('ratings')
    .insert(rating)
    .select()
    .single();

  if (error) {
    console.error('[API] Error creating rating:', error);

    // Special handling for unique constraint violation
    if (error.code === '23505') {
      throw new Error('Du hast diese Hütte bereits bewertet. Verwende "Bewertung ändern".');
    }

    throw new Error(`Failed to create rating: ${error.message}`);
  }

  return data;
}

/**
 * Updates an existing rating.
 *
 * @param restaurantId - The restaurant UUID
 * @param deviceId - The device UUID
 * @param updates - Fields to update
 * @returns Promise<Rating> - The updated rating
 */
export async function updateRating(
  restaurantId: string,
  deviceId: string,
  updates: UpdateRatingInput
): Promise<Rating> {
  const { data, error } = await supabase
    .from('ratings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('restaurant_id', restaurantId)
    .eq('device_id', deviceId)
    .select()
    .single();

  if (error) {
    console.error('[API] Error updating rating:', error);
    throw new Error(`Failed to update rating: ${error.message}`);
  }

  return data;
}

/**
 * Deletes a rating.
 *
 * WARNING: This also deletes associated photos and comment votes (CASCADE).
 *
 * @param restaurantId - The restaurant UUID
 * @param deviceId - The device UUID
 * @returns Promise<void>
 */
export async function deleteRating(
  restaurantId: string,
  deviceId: string
): Promise<void> {
  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('restaurant_id', restaurantId)
    .eq('device_id', deviceId);

  if (error) {
    console.error('[API] Error deleting rating:', error);
    throw new Error(`Failed to delete rating: ${error.message}`);
  }
}

/**
 * Gets the count of "Hilfreich" votes for a rating (comment).
 *
 * @param ratingId - The rating UUID
 * @returns Promise<number> - Number of votes
 */
export async function getCommentVoteCount(ratingId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comment_votes')
    .select('*', { count: 'exact', head: true })
    .eq('rating_id', ratingId);

  if (error) {
    console.error('[API] Error counting votes:', error);
    throw new Error(`Failed to count votes: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Checks if a user has voted a comment as helpful.
 *
 * @param ratingId - The rating UUID
 * @param deviceId - The device UUID
 * @returns Promise<boolean> - true if already voted
 */
export async function hasUserVoted(ratingId: string, deviceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('comment_votes')
    .select('*')
    .eq('rating_id', ratingId)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    console.error('[API] Error checking vote:', error);
    throw new Error(`Failed to check vote: ${error.message}`);
  }

  return data !== null;
}

/**
 * Toggles "Hilfreich" vote on a comment.
 * If already voted, removes the vote. Otherwise, adds the vote.
 *
 * IMPORTANT: The PRIMARY KEY (rating_id, device_id) ensures
 * that a user can only vote once per comment.
 *
 * @param ratingId - The rating UUID
 * @param deviceId - The device UUID
 * @returns Promise<boolean> - true if vote was added, false if removed
 */
export async function toggleCommentVote(
  ratingId: string,
  deviceId: string
): Promise<boolean> {
  const alreadyVoted = await hasUserVoted(ratingId, deviceId);

  if (alreadyVoted) {
    // Remove vote
    const { error } = await supabase
      .from('comment_votes')
      .delete()
      .eq('rating_id', ratingId)
      .eq('device_id', deviceId);

    if (error) {
      console.error('[API] Error removing vote:', error);
      throw new Error(`Failed to remove vote: ${error.message}`);
    }

    return false;
  } else {
    // Add vote
    const { error } = await supabase
      .from('comment_votes')
      .insert({ rating_id: ratingId, device_id: deviceId });

    if (error) {
      console.error('[API] Error adding vote:', error);
      throw new Error(`Failed to add vote: ${error.message}`);
    }

    return true;
  }
}

/**
 * Gets vote counts for multiple comments in one query (batch).
 * Replaces N+1 pattern of calling getCommentVoteCount per comment.
 */
export async function getCommentVoteCountsBatch(ratingIds: string[]): Promise<Map<string, number>> {
  if (ratingIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('comment_votes')
    .select('rating_id')
    .in('rating_id', ratingIds);

  if (error) {
    console.error('[API] Error getting vote counts batch:', error);
    return new Map();
  }

  const counts = new Map<string, number>();
  for (const vote of data) {
    counts.set(vote.rating_id, (counts.get(vote.rating_id) ?? 0) + 1);
  }

  return counts;
}

/**
 * Gets which comments a user has voted on (batch).
 * Replaces N+1 pattern of calling hasUserVoted per comment.
 */
export async function getUserVotedCommentsBatch(ratingIds: string[], deviceId: string): Promise<Set<string>> {
  if (ratingIds.length === 0 || !deviceId) return new Set();

  const { data, error } = await supabase
    .from('comment_votes')
    .select('rating_id')
    .in('rating_id', ratingIds)
    .eq('device_id', deviceId);

  if (error) {
    console.error('[API] Error getting user voted comments batch:', error);
    return new Set();
  }

  return new Set(data.map(v => v.rating_id));
}

/**
 * Gets the total number of "helpful" votes on all comments by a device.
 */
export async function getTotalCommentVotes(deviceId: string): Promise<number> {
  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('id')
    .eq('device_id', deviceId);

  if (ratingsError || !ratings || ratings.length === 0) return 0;

  const ratingIds = ratings.map(r => r.id);
  const { count, error } = await supabase
    .from('comment_votes')
    .select('*', { count: 'exact', head: true })
    .in('rating_id', ratingIds);

  if (error) {
    console.error('[API] Error counting total comment votes:', error);
    return 0;
  }

  return count ?? 0;
}
