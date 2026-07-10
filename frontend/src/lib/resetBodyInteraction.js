/**
 * Clears scroll locks and pointer-events overrides left by modals/overlays
 * (Radix Dialog, Robo overlay, video expand, etc.) — common cause of "frozen" mobile UI.
 */
export function resetBodyInteraction() {
  if (typeof document === 'undefined') return;

  document.body.style.overflow = '';
  document.body.style.pointerEvents = '';
  document.body.style.paddingRight = '';
  document.body.style.marginRight = '';
  document.body.removeAttribute('data-scroll-locked');

  document.documentElement.style.overflow = '';
  document.documentElement.style.pointerEvents = '';
}
