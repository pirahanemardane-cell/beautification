import { describe, expect, it } from "vitest"
import {
  cardRelX,
  nearestAt,
  normalizeLoopOffset,
  wrap,
} from "@/components/ui/polaroid-line-carousel"

/** Mirrors goTo's nearest-loop-copy target so we can assert wrap direction. */
function goToDesired(i: number, currentOff: number, sp: number, n: number): number {
  const period = n * sp
  const targetIdx = wrap(i, n)
  let desired = targetIdx * sp
  if (period > 0) {
    const k = Math.round((currentOff - desired) / period)
    desired = desired + k * period
  }
  return desired
}

describe("PolaroidLineCarousel infinite loop helpers", () => {
  const sp = 100
  const n = 6

  it("wraps indices both ways", () => {
    expect(wrap(0, n)).toBe(0)
    expect(wrap(n, n)).toBe(0)
    expect(wrap(-1, n)).toBe(n - 1)
    expect(wrap(n + 2, n)).toBe(2)
  })

  it("nearestAt wraps past the last print", () => {
    expect(nearestAt((n - 1) * sp, sp, n)).toBe(n - 1)
    expect(nearestAt((n - 0.4) * sp, sp, n)).toBe(0)
    expect(nearestAt(-0.6 * sp, sp, n)).toBe(n - 1)
  })

  it("cardRelX places neighbors across the seam", () => {
    expect(cardRelX(0, 0, sp, n)).toBe(0)
    expect(cardRelX(n - 1, 0, sp, n)).toBe(-sp)
    expect(cardRelX(0, n * sp, sp, n)).toBe(0)
    expect(cardRelX(1, n * sp, sp, n)).toBe(sp)
  })

  it("goTo continues forward from last → first", () => {
    expect(goToDesired(0, (n - 1) * sp, sp, n)).toBe(n * sp)
  })

  it("goTo continues backward from first → last", () => {
    expect(goToDesired(-1, 0, sp, n)).toBe(-sp)
  })

  it("normalizeLoopOffset keeps the visible slide", () => {
    expect(normalizeLoopOffset(n * sp, sp, n)).toBe(0)
    expect(normalizeLoopOffset(n * sp + 10, sp, n)).toBe(10)
    expect(normalizeLoopOffset(-sp, sp, n)).toBe((n - 1) * sp)
  })
})
