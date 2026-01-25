/**
 * Returns color for score display based on score value.
 *
 * Color mapping:
 * - Gray (no ratings): Unrated restaurant
 * - Red (< 0): Negative rating
 * - Yellow (0-9.9): Low rating
 * - Light Green (10-19.9): Good rating
 * - Green (≥ 20): Excellent rating
 *
 * @param score - The total score (-20 to +35)
 * @param ratingCount - Optional: number of ratings (0 = gray for unrated)
 * @returns Hex color string
 */
export function getScoreColor(score: number, ratingCount?: number): string {
  if (ratingCount !== undefined && ratingCount === 0) return '#9CA3AF'; // gray-400 (unbewertete Hütte)
  if (score < 0) return '#EF4444'; // red-500
  if (score >= 0 && score < 10) return '#F59E0B'; // amber-500
  if (score >= 10 && score < 20) return '#84CC16'; // lime-500 (Hellgrün)
  return '#10B981'; // green-500
}

/**
 * Returns background color for score display.
 * Lighter variant of the main color.
 *
 * @param score - The total score (-20 to +35)
 * @param ratingCount - Optional: number of ratings (0 = gray for unrated)
 * @returns Hex color string
 */
export function getScoreBackgroundColor(score: number, ratingCount?: number): string {
  if (ratingCount !== undefined && ratingCount === 0) return '#F3F4F6'; // gray-100 (unbewertete Hütte)
  if (score < 0) return '#FEE2E2'; // red-100
  if (score >= 0 && score < 10) return '#FEF3C7'; // amber-100
  if (score >= 10 && score < 20) return '#ECFCCB'; // lime-100 (Hellgrün)
  return '#D1FAE5'; // green-100
}

/**
 * Returns text color for score display.
 * Higher contrast variant for better readability.
 *
 * @param score - The total score (-20 to +35)
 * @param ratingCount - Optional: number of ratings (0 = gray for unrated)
 * @returns Hex color string
 */
export function getScoreTextColor(score: number, ratingCount?: number): string {
  if (ratingCount !== undefined && ratingCount === 0) return '#4B5563'; // gray-600 (unbewertete Hütte)
  if (score < 0) return '#991B1B'; // red-800
  if (score >= 0 && score < 10) return '#92400E'; // amber-800
  if (score >= 10 && score < 20) return '#3F6212'; // lime-800 (Hellgrün)
  return '#065F46'; // green-800
}

/**
 * Returns a border color for score display.
 *
 * @param score - The total score (-20 to +35)
 * @param ratingCount - Optional: number of ratings (0 = gray for unrated)
 * @returns Hex color string
 */
export function getScoreBorderColor(score: number, ratingCount?: number): string {
  if (ratingCount !== undefined && ratingCount === 0) return '#D1D5DB'; // gray-300 (unbewertete Hütte)
  if (score < 0) return '#FCA5A5'; // red-300
  if (score >= 0 && score < 10) return '#FCD34D'; // amber-300
  if (score >= 10 && score < 20) return '#BEF264'; // lime-300 (Hellgrün)
  return '#6EE7B7'; // green-300
}
