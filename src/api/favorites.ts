import { supabase } from './supabase';
import { SkiArea } from '../types';

/**
 * Gets all favorite ski areas for a device.
 *
 * @param deviceId - The device UUID
 * @returns Promise<SkiArea[]> - Array of favorite ski areas
 */
export async function getFavorites(deviceId: string): Promise<SkiArea[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('ski_area_id, ski_areas(*)')
    .eq('device_id', deviceId);

  if (error) {
    console.error('[API] Error loading favorites:', error);
    throw new Error(`Failed to load favorites: ${error.message}`);
  }

  // Extract ski_areas from the join result
  return data.map((f: any) => f.ski_areas);
}

/**
 * Checks if a ski area is favorited by a device.
 *
 * @param skiAreaId - The ski area UUID
 * @param deviceId - The device UUID
 * @returns Promise<boolean> - true if favorited, false otherwise
 */
export async function isFavorite(skiAreaId: string, deviceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('ski_area_id', skiAreaId)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    console.error('[API] Error checking favorite:', error);
    throw new Error(`Failed to check favorite: ${error.message}`);
  }

  return data !== null;
}

/**
 * Adds a ski area to favorites.
 *
 * IMPORTANT: The PRIMARY KEY (device_id, ski_area_id) ensures
 * that a ski area can only be favorited once per device.
 *
 * @param skiAreaId - The ski area UUID
 * @param deviceId - The device UUID
 * @returns Promise<void>
 */
export async function addFavorite(skiAreaId: string, deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ ski_area_id: skiAreaId, device_id: deviceId });

  if (error) {
    console.error('[API] Error adding favorite:', error);

    // Special handling for duplicate favorite (should not happen with UI logic)
    if (error.code === '23505') {
      // Silently ignore - already favorited
      return;
    }

    throw new Error(`Failed to add favorite: ${error.message}`);
  }
}

/**
 * Removes a ski area from favorites.
 *
 * @param skiAreaId - The ski area UUID
 * @param deviceId - The device UUID
 * @returns Promise<void>
 */
export async function removeFavorite(skiAreaId: string, deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('ski_area_id', skiAreaId)
    .eq('device_id', deviceId);

  if (error) {
    console.error('[API] Error removing favorite:', error);
    throw new Error(`Failed to remove favorite: ${error.message}`);
  }
}

/**
 * Toggles favorite status for a ski area.
 * If favorited, removes it. Otherwise, adds it.
 *
 * @param skiAreaId - The ski area UUID
 * @param deviceId - The device UUID
 * @returns Promise<boolean> - true if favorite was added, false if removed
 */
export async function toggleFavorite(
  skiAreaId: string,
  deviceId: string
): Promise<boolean> {
  const isFav = await isFavorite(skiAreaId, deviceId);

  if (isFav) {
    await removeFavorite(skiAreaId, deviceId);
    return false;
  } else {
    await addFavorite(skiAreaId, deviceId);
    return true;
  }
}
