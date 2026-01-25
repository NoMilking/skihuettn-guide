import { useState, useEffect } from 'react';
import { getDeviceId } from '../storage/device';

/**
 * Custom hook for accessing the device ID.
 *
 * The device ID is loaded once on mount and cached.
 * It's used throughout the app for:
 * - Creating ratings
 * - Managing favorites
 * - Voting on comments
 *
 * @returns Object with deviceId (string | null) and loading (boolean)
 *
 * @example
 * function MyComponent() {
 *   const { deviceId, loading } = useDevice();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (!deviceId) return <ErrorMessage />;
 *
 *   // Use deviceId for API calls
 * }
 */
export function useDevice() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    getDeviceId()
      .then(id => {
        if (isMounted) {
          setDeviceId(id);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('[useDevice] Failed to get device ID:', err);
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { deviceId, loading, error };
}
