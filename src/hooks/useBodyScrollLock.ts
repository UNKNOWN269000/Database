import { useEffect } from "react";

/**
 * Reference-counted body scroll lock.
 *
 * When multiple modals (e.g. a row detail modal opened on top of a
 * table modal) want to lock the body scroll, we need to keep it
 * locked until ALL of them are closed. A simple `body.style.overflow = "hidden"`
 * toggle would unlock too early when the first modal unmounts,
 * causing the page behind the second modal to scroll.
 *
 * This module exports a pair of functions that increment/decrement
 * a module-level counter, plus a React hook for convenient use in
 * useEffect cleanup.
 */

let lockCount = 0;
let previousOverflow = "";

const lock = () => {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount++;
};

const unlock = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
  }
};

/**
 * React hook that locks the body scroll for as long as `enabled` is true.
 * Uses a ref-counted lock so multiple modals can be open simultaneously
 * without the body scroll being released prematurely.
 */
export function useBodyScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    lock();
    return () => {
      unlock();
    };
  }, [enabled]);
}
