"use client";

import { useCallback, useRef } from "react";

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;

    // マリンバ風: G5(784Hz)とD6(1174Hz)を少しずらして鳴らす
    const notes: [number, number][] = [
      [784, 0],
      [1174, 0.12],
    ];

    notes.forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      osc.start(t);
      osc.stop(t + 1.0);
    });
  }, []);

  return { playChime };
}
