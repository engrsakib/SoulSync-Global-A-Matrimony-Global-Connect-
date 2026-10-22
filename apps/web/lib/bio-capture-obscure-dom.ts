const OVERLAY_SELECTOR = '[data-bio-capture-overlay]';

/** Apply blur before React paints (Print Screen races the compositor). */
export function applyCaptureObscureImmediate(node: HTMLElement | null): void {
  if (!node) {
    return;
  }
  node.classList.add('bio-deterrent-obscured', 'bio-deterrent-obscured--instant');
  if (node.querySelector(OVERLAY_SELECTOR)) {
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'bio-deterrent-overlay';
  overlay.dataset.bioCaptureOverlay = 'true';
  overlay.setAttribute('aria-hidden', 'true');
  node.prepend(overlay);
}

export function clearCaptureObscureImmediate(node: HTMLElement | null): void {
  if (!node) {
    return;
  }
  node.classList.remove('bio-deterrent-obscured', 'bio-deterrent-obscured--instant');
  node.querySelector(OVERLAY_SELECTOR)?.remove();
}
