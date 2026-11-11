/**
 * Desktop cursor scrolling utilities for horizontal ribbons/pickers.
 * Handles overflow detection, mouse wheel translation, and drag-to-scroll.
 */

export interface ScrollMetrics {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

export interface ScrollAvailability {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

/**
 * Checks whether a container can be scrolled left or right, with tolerance
 * for subpixel rounding.
 */
export function canScroll(metrics: ScrollMetrics, tolerance = 2): ScrollAvailability {
  const { scrollLeft, scrollWidth, clientWidth } = metrics;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);

  const canScrollLeft = scrollLeft > tolerance;
  const canScrollRight = maxScroll > tolerance && scrollLeft < maxScroll - tolerance;

  return { canScrollLeft, canScrollRight };
}

/**
 * Determines whether a mouse wheel event should be intercepted and translated
 * to horizontal scroll.
 * Returns false when:
 * - Horizontal swipe is dominant (e.g. trackpads or horizontal mouse wheels)
 * - Container cannot scroll any further in the wheel direction (releases scroll to parent page)
 */
export function shouldHandleWheel({
  deltaX,
  deltaY,
  canScrollLeft,
  canScrollRight,
}: {
  deltaX: number;
  deltaY: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}): boolean {
  // Dominant horizontal intent (e.g. trackpad swipe): let native scroll handle it
  if (Math.abs(deltaY) <= Math.abs(deltaX)) {
    return false;
  }

  // Scrolling down -> scroll right
  if (deltaY > 0 && canScrollRight) {
    return true;
  }

  // Scrolling up -> scroll left
  if (deltaY < 0 && canScrollLeft) {
    return true;
  }

  return false;
}

/**
 * Translates mouse drag into horizontal scroll position.
 * Suppresses drag flag for movements <= threshold (avoids accidental drag on clicks).
 */
export function calculateDragScroll({
  startX,
  currentX,
  initialScrollLeft,
  threshold = 4,
}: {
  startX: number;
  currentX: number;
  initialScrollLeft: number;
  threshold?: number;
}): { scrollLeft: number; hasDragged: boolean } {
  const dx = currentX - startX;
  const hasDragged = Math.abs(dx) > threshold;
  return {
    scrollLeft: initialScrollLeft - dx,
    hasDragged,
  };
}

/**
 * Computes smooth scroll jump distance when chevron arrow buttons are clicked.
 */
export function getScrollDistance(clientWidth: number, direction: -1 | 1, minDistance = 200): number {
  const distance = Math.max(clientWidth * 0.75, minDistance);
  return direction * distance;
}
