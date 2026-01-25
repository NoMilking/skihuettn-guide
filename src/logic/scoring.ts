import { Rating } from '../types';

/**
 * Calculates total score for a rating.
 *
 * CRITICAL: This is a SUM, not an average!
 *
 * Formula:
 * score = self_service + service + ski_haserl + food +
 *         sun_terrace + interior + apres_ski + (eggnog ? 5 : 0)
 *
 * Range: -20 to +35
 * - Minimum: self_service = -20, all others = 0
 * - Maximum: self_service = 0, all sliders = 5, eggnog = true
 *
 * @param rating - Partial rating object (can be incomplete during input)
 * @returns Total score as a number
 */
export function calculateTotalScore(rating: Partial<Rating>): number {
  return (
    (rating.self_service ?? 0) +
    (rating.service ?? 0) +
    (rating.ski_haserl ?? 0) +
    (rating.food ?? 0) +
    (rating.sun_terrace ?? 0) +
    (rating.interior ?? 0) +
    (rating.apres_ski ?? 0) +
    (rating.eggnog ? 5 : 0)
  );
}

/**
 * Validates that a slider value is within allowed range.
 * Must be between 0-5, in steps of 0.5
 *
 * @param value - The slider value to validate
 * @returns true if valid, false otherwise
 */
export function isValidSliderValue(value: number): boolean {
  if (value < 0 || value > 5) return false;

  // Check if it's a valid step (0, 0.5, 1, 1.5, etc.)
  // Multiply by 10 to avoid floating point issues
  const remainder = (value * 10) % 5;
  return remainder === 0;
}

/**
 * Validates self-service value.
 * Must be one of: -20, -10, or 0
 *
 * @param value - The self-service value to validate
 * @returns true if valid, false otherwise
 */
export function isValidSelfService(value: number): value is -20 | -10 | 0 {
  return value === -20 || value === -10 || value === 0;
}

/**
 * Gets the label for a self-service value
 *
 * @param value - The self-service value (-20, -10, or 0)
 * @returns German label for the self-service type
 */
export function getSelfServiceLabel(value: -20 | -10 | 0): string {
  switch (value) {
    case -20:
      return 'Nur Selbstbedienung';
    case -10:
      return 'Teilweise Selbstbedienung';
    case 0:
      return 'Mit Bedienung';
  }
}
