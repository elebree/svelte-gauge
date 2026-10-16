import { expect, test } from "@playwright/test";
import { calcCurvePath, calcLabelOffset, finiteOr, polarToCartesian, scale } from "../../src/lib/util.js";

test.describe("scale", () => {
  test("maps the range linearly onto the target", () => {
    expect(scale(25, 0, 100, 0, 360)).toBe(90);
    expect(scale(15, 10, 20, 40, 320)).toBe(180);
  });

  test("clamps values outside the range", () => {
    expect(scale(150, 0, 100, 0, 360)).toBe(360);
    expect(scale(-50, 0, 100, 0, 360)).toBe(0);
  });

  test("supports reversed ranges", () => {
    expect(scale(25, 100, 0, 0, 360)).toBeCloseTo(270);
    expect(scale(150, 100, 0, 0, 360)).toBe(0);
    expect(scale(-10, 100, 0, 0, 360)).toBe(360);
  });

  test("maps an empty range, a non-finite range and NaN to the target start", () => {
    expect(scale(50, 50, 50, 10, 360)).toBe(10);
    expect(scale(50, NaN, 100, 10, 360)).toBe(10);
    expect(scale(50, 0, Infinity, 10, 360)).toBe(10);
    expect(scale(NaN, 0, 100, 10, 360)).toBe(10);
  });

  test("clamps infinite values to the range bounds", () => {
    expect(scale(Infinity, 0, 100, 0, 360)).toBe(360);
    expect(scale(-Infinity, 0, 100, 0, 360)).toBe(0);
  });
});

test.describe("polarToCartesian", () => {
  // Angle 0 points down and angles grow clockwise on screen
  test("places angles around the center", () => {
    expect(polarToCartesian(100, 10, 0)).toEqual({ x: "100.000", y: "190.000" });
    expect(polarToCartesian(100, 10, Math.PI / 2)).toEqual({ x: "10.000", y: "100.000" });
    expect(polarToCartesian(100, 10, Math.PI)).toEqual({ x: "100.000", y: "10.000" });
  });
});

test.describe("calcLabelOffset", () => {
  test("spreads labels over the middle half of the label path", () => {
    expect([0, 1, 2].map((i) => calcLabelOffset(i, 3, false))).toEqual([25, 50, 75]);
    expect(calcLabelOffset(0, 1, false)).toBe(25);
  });

  test("centers labels in equal slots", () => {
    expect([0, 1, 2].map((i) => calcLabelOffset(i, 3, true))).toEqual([33.33, 50, 66.67]);
    expect(calcLabelOffset(0, 1, true)).toBe(50);
  });
});

test.describe("finiteOr", () => {
  test("keeps finite numbers not below the minimum", () => {
    expect(finiteOr(12, 20, "stroke")).toBe(12);
    expect(finiteOr(0, 20, "stroke", 0)).toBe(0);
  });

  test("falls back for non-numbers, non-finite numbers and values below the minimum", () => {
    for (const value of [NaN, Infinity, -Infinity, "10px", undefined, null]) {
      expect(finiteOr(value, 20, "stroke"), String(value)).toBe(20);
    }
    expect(finiteOr(-5, 20, "stroke", 0)).toBe(20);
    expect(finiteOr(NaN, undefined, "value")).toBeUndefined();
  });

  test("stays silent outside Vite dev builds", () => {
    const warn = console.warn;
    const messages: unknown[] = [];
    console.warn = (...args: unknown[]) => messages.push(args);
    try {
      finiteOr(NaN, 0, "start");
    } finally {
      console.warn = warn;
    }
    expect(messages).toEqual([]);
  });
});

test.describe("calcCurvePath", () => {
  const radius = 100;
  const offset = 10;
  const r = radius - offset;

  type Arc = { rx: number; largeArc: number; sweep: number; from: [number, number]; to: [number, number] };

  // Splits "M x y A rx ry 0 large sweep x y ..." into arcs with their start and end points
  const parse = (d: string) => {
    const nums = d.replace(/[MA]/g, " ").trim().split(/\s+/).map(Number);
    const arcs: Arc[] = [];
    let from: [number, number] = [nums[0], nums[1]];
    for (let i = 2; i < nums.length; i += 7) {
      const to: [number, number] = [nums[i + 5], nums[i + 6]];
      arcs.push({ rx: nums[i], largeArc: nums[i + 3], sweep: nums[i + 4], from, to });
      from = to;
    }
    return arcs;
  };

  // Center of an SVG arc with rx = ry and no rotation, from its endpoints and flags (SVG spec F.6.5)
  const center = ({ from, to, largeArc, sweep }: Arc) => {
    const hx = (from[0] - to[0]) / 2;
    const hy = (from[1] - to[1]) / 2;
    const k = Math.sqrt(Math.max(0, (r * r - hx * hx - hy * hy) / (hx * hx + hy * hy))) * (largeArc !== sweep ? 1 : -1);
    return [k * hy + (from[0] + to[0]) / 2, -k * hx + (from[1] + to[1]) / 2];
  };

  const point = (degrees: number) => {
    const p = polarToCartesian(radius, offset, (degrees * Math.PI) / 180);
    return [Number(p.x), Number(p.y)];
  };

  const sweeps: [number, number][] = [
    [0, 90], [0, 180], [0, 270], [0, 359], [0, 360], [0, 540], [0, 720], [45, 315], [-180, 540],
    [45, -45], [0, -90], [0, -180], [0, -270], [0, -359], [0, -360], [90, -630],
  ];

  for (const [start, end] of sweeps) {
    test(`draws ${start}° to ${end}° around the gauge center in the right direction`, () => {
      const d = calcCurvePath(radius, offset, start, end);
      expect(d).not.toMatch(/NaN|Infinity/);
      const arcs = parse(d);
      // One SVG arc can't draw a full circle, so long sweeps are split
      expect(arcs.length).toBe(Math.max(1, Math.ceil(Math.abs(end - start) / (360 * 0.99995))));
      expect(arcs[0].from).toEqual(point(start));
      for (const arc of arcs) {
        expect(arc.rx).toBe(r);
        expect(arc.sweep).toBe(end > start ? 1 : 0);
        const [cx, cy] = center(arc);
        expect(cx).toBeCloseTo(radius, 1);
        expect(cy).toBeCloseTo(radius, 1);
      }
      const [x, y] = point(end);
      expect(arcs.at(-1)!.to[0]).toBeCloseTo(x, 3);
      expect(arcs.at(-1)!.to[1]).toBeCloseTo(y, 3);
    });
  }

  test("a zero-length sweep is a single arc back to its start, drawn as a dot", () => {
    const arcs = parse(calcCurvePath(radius, offset, 300, 300));
    expect(arcs).toHaveLength(1);
    expect(arcs[0].to).toEqual(arcs[0].from);
  });

  test("returns an empty path for non-finite angles", () => {
    expect(calcCurvePath(radius, offset, NaN, 90)).toBe("");
    expect(calcCurvePath(radius, offset, 0, Infinity)).toBe("");
  });
});
