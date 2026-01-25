import { supabase } from './supabase';
import { SkiArea } from '../types';

/**
 * Loads all ski areas from the database.
 *
 * @returns Promise<SkiArea[]> - Array of all ski areas, sorted by name
 * @throws Error if the query fails
 */
export async function getSkiAreas(): Promise<SkiArea[]> {
  const { data, error } = await supabase
    .from('ski_areas')
    .select('*')
    .order('name');

  if (error) {
    console.error('[API] Error loading ski areas:', error);
    throw new Error(`Failed to load ski areas: ${error.message}`);
  }

  return data;
}

/**
 * Loads a single ski area by ID.
 *
 * @param id - The ski area UUID
 * @returns Promise<SkiArea> - The ski area object
 * @throws Error if not found or query fails
 */
export async function getSkiAreaById(id: string): Promise<SkiArea> {
  const { data, error } = await supabase
    .from('ski_areas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[API] Error loading ski area:', error);
    throw new Error(`Failed to load ski area: ${error.message}`);
  }

  return data;
}

/**
 * Searches ski areas by name.
 * Case-insensitive partial match.
 *
 * @param query - Search query string
 * @returns Promise<SkiArea[]> - Matching ski areas
 */
export async function searchSkiAreas(query: string): Promise<SkiArea[]> {
  if (!query.trim()) {
    return getSkiAreas();
  }

  const { data, error } = await supabase
    .from('ski_areas')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name');

  if (error) {
    console.error('[API] Error searching ski areas:', error);
    throw new Error(`Failed to search ski areas: ${error.message}`);
  }

  return data;
}

/**
 * Gets the public URL for a map image stored in Supabase Storage.
 *
 * @param storagePath - The path to the image in the 'maps' bucket
 * @param quality - 'low' for quick loading preview, 'high' for full resolution
 * @returns The public URL for the image
 */
export function getMapImageUrl(storagePath: string, quality: 'low' | 'high' = 'high'): string {
  // Replace extension with quality suffix
  // e.g., "saalbach.png" -> "saalbach-low.png" or "saalbach-high.png"
  const qualityPath = storagePath.replace(/\.([^.]+)$/, `-${quality}.$1`);
  const { data } = supabase.storage
    .from('maps')
    .getPublicUrl(qualityPath);
  return data.publicUrl;
}
