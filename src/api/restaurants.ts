import { supabase } from './supabase';
import { Restaurant, RestaurantStats } from '../types';

/**
 * Loads all restaurants for a specific ski area with aggregated stats.
 * Uses the restaurant_stats materialized view for performance.
 *
 * @param skiAreaId - The ski area UUID
 * @param sortBy - Sort field (default: 'avg_total_score')
 * @param ascending - Sort direction (default: false = descending)
 * @returns Promise<RestaurantStats[]> - Array of restaurants with stats
 */
export async function getRestaurantsBySkiArea(
  skiAreaId: string,
  sortBy: keyof RestaurantStats = 'avg_total_score',
  ascending: boolean = false
): Promise<RestaurantStats[]> {
  const { data, error } = await supabase
    .from('restaurant_stats')
    .select('*')
    .eq('ski_area_id', skiAreaId)
    .order(sortBy, { ascending });

  if (error) {
    console.error('[API] Error loading restaurants:', error);
    throw new Error(`Failed to load restaurants: ${error.message}`);
  }

  return data;
}

/**
 * Loads a single restaurant by ID (without stats).
 *
 * @param id - The restaurant UUID
 * @returns Promise<Restaurant> - The restaurant object
 */
export async function getRestaurantById(id: string): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[API] Error loading restaurant:', error);
    throw new Error(`Failed to load restaurant: ${error.message}`);
  }

  return data;
}

/**
 * Loads restaurant statistics from the materialized view.
 *
 * @param restaurantId - The restaurant UUID
 * @returns Promise<RestaurantStats> - Aggregated restaurant statistics
 */
export async function getRestaurantStats(restaurantId: string): Promise<RestaurantStats> {
  const { data, error } = await supabase
    .from('restaurant_stats')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .single();

  if (error) {
    console.error('[API] Error loading restaurant stats:', error);
    throw new Error(`Failed to load restaurant stats: ${error.message}`);
  }

  return data;
}

/**
 * Filters restaurants by score threshold.
 *
 * @param skiAreaId - The ski area UUID
 * @param minScore - Minimum average total score (-20 to +35)
 * @returns Promise<RestaurantStats[]> - Filtered restaurants
 */
export async function getRestaurantsByMinScore(
  skiAreaId: string,
  minScore: number
): Promise<RestaurantStats[]> {
  const { data, error } = await supabase
    .from('restaurant_stats')
    .select('*')
    .eq('ski_area_id', skiAreaId)
    .gte('avg_total_score', minScore)
    .order('avg_total_score', { ascending: false });

  if (error) {
    console.error('[API] Error filtering restaurants by score:', error);
    throw new Error(`Failed to filter restaurants: ${error.message}`);
  }

  return data;
}

/**
 * Gets restaurants sorted by a specific category average.
 * Useful for "Nur Après-Ski" filter.
 *
 * @param skiAreaId - The ski area UUID
 * @param category - Category to sort by (e.g., 'avg_apres_ski')
 * @returns Promise<RestaurantStats[]> - Sorted restaurants
 */
export async function getRestaurantsByCategory(
  skiAreaId: string,
  category: keyof RestaurantStats
): Promise<RestaurantStats[]> {
  return getRestaurantsBySkiArea(skiAreaId, category, false);
}
