import { useEffect, useRef } from "react";

const BASE_PATH = import.meta.env.BASE_URL ?? "/";

// Client-side scheduler: pings /api/reflections/generate periodically.
// The server enforces all real rate limits — this is just a trigger.
// Fires 35–65 minutes after last attempt (randomized to avoid predictable bursts).
export function useReflectionScheduler() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = () => {
    // Random interval: 35–65 minutes in ms
    const ms = (35 + Math.random() * 30) * 60 * 1000;

    timerRef.current = setTimeout(async () => {
      try {
        await fetch(`${BASE_PATH}api/reflections/generate`, { method: "POST" });
      } catch {
        // Silently ignore — server is the source of truth
      }
      scheduleNext(); // reschedule after each attempt
    }, ms);
  };

  useEffect(() => {
    // Trigger once on mount (after short delay) then on schedule
    const initial = setTimeout(async () => {
      try {
        await fetch(`${BASE_PATH}api/reflections/generate`, { method: "POST" });
      } catch {}
      scheduleNext();
    }, 90_000); // 90s after page load — let real posts arrive first

    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
