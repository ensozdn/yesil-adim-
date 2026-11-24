export type HapticKind = 'light' | 'success' | 'error';

export const triggerHaptic = (kind: HapticKind): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    if (kind === 'light') {
      navigator.vibrate(14);
    } else if (kind === 'success') {
      navigator.vibrate([18, 45, 28]);
    } else {
      navigator.vibrate([32, 35, 32]);
    }
  } catch {}
};
