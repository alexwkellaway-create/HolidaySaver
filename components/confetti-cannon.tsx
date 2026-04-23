"use client";
import { forwardRef, useImperativeHandle, useCallback } from "react";
import confetti from "canvas-confetti";

export interface ConfettiCannonHandle {
  fire: () => void;
}

/**
 * Invisible component that exposes a `fire()` method.
 * Parent calls ref.current.fire() to trigger confetti.
 */
export const ConfettiCannon = forwardRef<ConfettiCannonHandle>((_, ref) => {
  const fire = useCallback(() => {
    // Two bursts from opposite sides for a party feel
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function burst(particleRatio: number, opts: confetti.Options) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }

    burst(0.25, { spread: 26, startVelocity: 55 });
    burst(0.2, { spread: 60 });
    burst(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    burst(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    burst(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  useImperativeHandle(ref, () => ({ fire }), [fire]);

  return null; // No visual DOM element needed
});

ConfettiCannon.displayName = "ConfettiCannon";
