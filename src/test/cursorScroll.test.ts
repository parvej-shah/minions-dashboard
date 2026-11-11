import { describe, expect, it } from "vitest";
import {
  canScroll,
  shouldHandleWheel,
  calculateDragScroll,
  getScrollDistance,
} from "@/lib/ui/cursorScroll";

describe("cursorScroll", () => {
  describe("canScroll", () => {
    it("reports cannot scroll in either direction when content fits within client width", () => {
      const result = canScroll({ scrollLeft: 0, scrollWidth: 500, clientWidth: 500 });
      expect(result.canScrollLeft).toBe(false);
      expect(result.canScrollRight).toBe(false);
    });

    it("reports can scroll right only when at the start of overflowing content", () => {
      const result = canScroll({ scrollLeft: 0, scrollWidth: 1000, clientWidth: 500 });
      expect(result.canScrollLeft).toBe(false);
      expect(result.canScrollRight).toBe(true);
    });

    it("reports can scroll in both directions when in the middle of overflowing content", () => {
      const result = canScroll({ scrollLeft: 200, scrollWidth: 1000, clientWidth: 500 });
      expect(result.canScrollLeft).toBe(true);
      expect(result.canScrollRight).toBe(true);
    });

    it("reports can scroll left only when scrolled to the end", () => {
      const result = canScroll({ scrollLeft: 500, scrollWidth: 1000, clientWidth: 500 });
      expect(result.canScrollLeft).toBe(true);
      expect(result.canScrollRight).toBe(false);
    });

    it("handles subpixel tolerance gracefully", () => {
      // 1px away from start
      expect(canScroll({ scrollLeft: 1, scrollWidth: 1000, clientWidth: 500 }).canScrollLeft).toBe(false);
      // 1px away from end (scrollWidth - clientWidth = 500)
      expect(canScroll({ scrollLeft: 499, scrollWidth: 1000, clientWidth: 500 }).canScrollRight).toBe(false);
    });
  });

  describe("shouldHandleWheel", () => {
    it("ignores wheel events when horizontal delta dominates (e.g. native trackpad swipe)", () => {
      const handled = shouldHandleWheel({
        deltaX: 40,
        deltaY: 5,
        canScrollLeft: true,
        canScrollRight: true,
      });
      expect(handled).toBe(false);
    });

    it("handles vertical wheel down when container can scroll right", () => {
      const handled = shouldHandleWheel({
        deltaX: 0,
        deltaY: 100,
        canScrollLeft: false,
        canScrollRight: true,
      });
      expect(handled).toBe(true);
    });

    it("releases vertical wheel down to native page scroll when end is reached", () => {
      const handled = shouldHandleWheel({
        deltaX: 0,
        deltaY: 100,
        canScrollLeft: true,
        canScrollRight: false,
      });
      expect(handled).toBe(false);
    });

    it("handles vertical wheel up when container can scroll left", () => {
      const handled = shouldHandleWheel({
        deltaX: 0,
        deltaY: -100,
        canScrollLeft: true,
        canScrollRight: true,
      });
      expect(handled).toBe(true);
    });

    it("releases vertical wheel up to native page scroll when start is reached", () => {
      const handled = shouldHandleWheel({
        deltaX: 0,
        deltaY: -100,
        canScrollLeft: false,
        canScrollRight: true,
      });
      expect(handled).toBe(false);
    });
  });

  describe("calculateDragScroll", () => {
    it("translates cursor movement into inverse scroll position", () => {
      // Dragging left (moving mouse 50px to the left from 200 to 150) should increase scrollLeft by 50
      const result = calculateDragScroll({
        startX: 200,
        currentX: 150,
        initialScrollLeft: 100,
      });
      expect(result.scrollLeft).toBe(150);
      expect(result.hasDragged).toBe(true);
    });

    it("dragging right decreases scrollLeft", () => {
      const result = calculateDragScroll({
        startX: 200,
        currentX: 250,
        initialScrollLeft: 100,
      });
      expect(result.scrollLeft).toBe(50);
      expect(result.hasDragged).toBe(true);
    });

    it("does not flag hasDragged for micro-movements <= 4px (prevents accidental drag on normal clicks)", () => {
      const result = calculateDragScroll({
        startX: 200,
        currentX: 203,
        initialScrollLeft: 100,
      });
      expect(result.hasDragged).toBe(false);
    });
  });

  describe("getScrollDistance", () => {
    it("returns 75% of client width in the chosen direction", () => {
      expect(getScrollDistance(400, 1)).toBe(300);
      expect(getScrollDistance(400, -1)).toBe(-300);
    });

    it("respects minimum scroll distance", () => {
      expect(getScrollDistance(200, 1)).toBe(200);
      expect(getScrollDistance(200, -1)).toBe(-200);
    });
  });
});
