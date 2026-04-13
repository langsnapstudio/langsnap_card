import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Returns true when the device has internet access.
 * Checks on mount and every time the app comes to the foreground.
 * Uses a lightweight HEAD fetch to a reliable endpoint.
 */
export function useNetworkStatus(): { isOnline: boolean; recheck: () => void } {
  const [isOnline, setIsOnline] = useState(true);

  const check = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  };

  const checkRef = useRef(check);
  checkRef.current = check;

  useEffect(() => {
    checkRef.current();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkRef.current();
    });
    return () => sub.remove();
  }, []);

  return { isOnline, recheck: () => checkRef.current() };
}
