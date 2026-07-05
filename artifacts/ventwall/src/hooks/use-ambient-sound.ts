import { useCallback, useEffect, useRef, useState } from "react";

export const AMBIENT_SRC = "/sounds/cathedral-of-ash.mp3";
const STORAGE_KEY = "vw-ambient-enabled";
const FADE_DURATION_MS = 1800;
const TARGET_VOLUME = 0.28;

export function useAmbientSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRafRef = useRef<number>(0);

  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [ready, setReady] = useState(false);

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    audioRef.current = audio;

    const onCanPlay = () => setReady(true);
    audio.addEventListener("canplaythrough", onCanPlay);

    return () => {
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  // Smooth fade helper
  const fadeTo = useCallback((targetVol: number, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelAnimationFrame(fadeRafRef.current);

    const startVol = audio.volume;
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / FADE_DURATION_MS, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      audio.volume = startVol + (targetVol - startVol) * eased;
      if (t < 1) {
        fadeRafRef.current = requestAnimationFrame(tick);
      } else {
        audio.volume = targetVol;
        onDone?.();
      }
    };
    fadeRafRef.current = requestAnimationFrame(tick);
  }, []);

  // React to enabled changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      audio.play().catch(() => {
        // Autoplay blocked — user needs to interact first; we'll retry on next user action
      });
      fadeTo(TARGET_VOLUME);
    } else {
      fadeTo(0, () => audio.pause());
    }
  }, [enabled, fadeTo]);

  // Persist preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {}
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);
  const enable = useCallback(() => setEnabled(true), []);
  const disable = useCallback(() => setEnabled(false), []);

  return { enabled, ready, toggle, enable, disable };
}
