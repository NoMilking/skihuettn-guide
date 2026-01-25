import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = '@skihuttn_device_id';

/**
 * Gets or creates a device ID.
 *
 * This function is called once on app initialization to retrieve
 * or generate a unique device identifier. The ID is stored in
 * AsyncStorage and persists across app restarts.
 *
 * CRITICAL: This ID is used for:
 * - Identifying user's ratings (ratings.device_id)
 * - Tracking favorites (favorites.device_id)
 * - Preventing duplicate votes (comment_votes.device_id)
 *
 * The device ID is anonymous and NEVER deleted.
 *
 * @returns Promise<string> - The device ID (UUID v4 format)
 *
 * @example
 * const deviceId = await getDeviceId();
 * // First call: generates new UUID and stores it
 * // Subsequent calls: returns the stored UUID
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate new UUID
      deviceId = uuidv4();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('[Device] Generated new device ID:', deviceId);
    } else {
      console.log('[Device] Retrieved existing device ID:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('[Device] Error getting device ID:', error);
    // Fallback: Generate session-only ID (will regenerate on restart)
    const fallbackId = uuidv4();
    console.warn('[Device] Using fallback session ID:', fallbackId);
    return fallbackId;
  }
}

/**
 * Clears the device ID from storage.
 *
 * WARNING: This will cause the user to lose access to their ratings
 * and favorites! Only use for testing/debugging purposes.
 *
 * @returns Promise<void>
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    console.log('[Device] Device ID cleared');
  } catch (error) {
    console.error('[Device] Error clearing device ID:', error);
  }
}

/**
 * Checks if a device ID exists in storage.
 *
 * @returns Promise<boolean> - true if device ID exists, false otherwise
 */
export async function hasDeviceId(): Promise<boolean> {
  try {
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    return deviceId !== null;
  } catch (error) {
    console.error('[Device] Error checking device ID:', error);
    return false;
  }
}
