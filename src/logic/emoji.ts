import { RestaurantStats } from '../types';

export interface EmojiConfig {
  category: keyof RestaurantStats;
  emoji: string;
  threshold: number;
  priority: number;
}

/**
 * Emoji configurations with STRICT priority order.
 *
 * CRITICAL: The priority order must NEVER be changed!
 * 1. Après-Ski (highest priority)
 * 2. Essen
 * 3. Service
 * 4. Sonnenterrasse
 * 5. Einrichtung (lowest priority)
 *
 * An emoji is only shown when the category average is > 4.5
 */
const EMOJI_CONFIGS: EmojiConfig[] = [
  { category: 'avg_apres_ski', emoji: '🍾', threshold: 4.5, priority: 1 },
  { category: 'avg_food', emoji: '🍽️', threshold: 4.5, priority: 2 },
  { category: 'avg_service', emoji: '🧑‍🍳', threshold: 4.5, priority: 3 },
  { category: 'avg_sun_terrace', emoji: '☀️', threshold: 4.5, priority: 4 },
  { category: 'avg_interior', emoji: '🛋️', threshold: 4.5, priority: 5 },
];

/**
 * Gets emojis for a restaurant based on aggregated statistics.
 *
 * CRITICAL RULES:
 * - Maximum 3 regular emojis are shown
 * - Emojis are selected by strict priority (see EMOJI_CONFIGS)
 * - A category must have average > 4.5 to qualify
 * - Eggnog emoji is ADDITIONAL (doesn't count toward the 3)
 * - Eggnog shown when >= 50% of ratings have eggnog = true
 *
 * @param stats - Aggregated restaurant statistics
 * @returns Array of emoji strings (max 3 regular + eggnog if applicable)
 *
 * @example
 * // Restaurant with Après=4.8, Essen=4.6, Service=4.7, Eggnog=60%
 * getEmojisForRestaurant(stats) // ['🍾', '🍽️', '🧑‍🍳', '🥚🥛']
 *
 * @example
 * // Restaurant with Essen=4.9, Sonnenterrasse=4.8, Après=4.3
 * getEmojisForRestaurant(stats) // ['🍽️', '☀️'] (only 2, Après doesn't qualify)
 */
export function getEmojisForRestaurant(stats: RestaurantStats): string[] {
  const emojis: string[] = [];

  // Get regular emojis (max 3)
  const qualifyingEmojis = EMOJI_CONFIGS
    .filter(config => {
      const value = stats[config.category] as number;
      return value > config.threshold;
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(config => config.emoji);

  emojis.push(...qualifyingEmojis);

  // Add eggnog emoji if >= 50% of ratings have it
  if (stats.eggnog_percentage >= 0.5) {
    emojis.push('🥚🥛');
  }

  return emojis;
}

/**
 * Gets the emoji for a specific category.
 * Used in detail views to show individual category emojis.
 *
 * @param category - The category name (without 'avg_' prefix)
 * @returns The emoji string, or empty string if not found
 */
export function getEmojiForCategory(category: string): string {
  const config = EMOJI_CONFIGS.find(c => c.category === `avg_${category}`);
  return config?.emoji ?? '';
}

/**
 * Gets all emoji configurations (for reference/display purposes)
 *
 * @returns Array of all emoji configurations
 */
export function getAllEmojiConfigs(): EmojiConfig[] {
  return [...EMOJI_CONFIGS];
}
