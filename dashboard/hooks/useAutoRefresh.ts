import { useCallback, useEffect, useState } from "react";

interface UseAutoRefreshOptions {
  interval: number;
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
}

export function useAutoRefresh({
  interval,
  onRefresh,
  enabled = true,
}: UseAutoRefreshOptions) {
  const [countdown, setCountdown] = useState(interval);

  const refresh = useCallback(async () => {
    setCountdown(interval);
    await onRefresh();
  }, [onRefresh, interval]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled]);

  useEffect(() => {
    if (enabled && countdown <= 0) {
      const timer = setTimeout(() => {
        refresh();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [enabled, countdown, refresh]);

  return { countdown, setCountdown, refresh };
}
