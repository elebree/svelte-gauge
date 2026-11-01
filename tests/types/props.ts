// Type tests for the component props, checked by `pnpm check` (svelte-check). Nothing here runs.
import type { ComponentProps } from "svelte";
import type Gauge from "../../src/lib/Gauge.svelte";

type Props = ComponentProps<Gauge>;

// Every prop with its documented type, both segment forms and both displayValue forms
export const allProps = {
  value: 50,
  start: 0,
  stop: 100,
  startAngle: 0,
  stopAngle: 360,
  stroke: 20,
  width: 200,
  labels: ["Low", "High"],
  labelsCentered: true,
  segments: [
    [0, 50],
    { start: 50, stop: 100, color: "red", label: "High" },
  ],
  class: "custom",
  color: "red",
  easing: (t: number) => t,
  displayValue: ({ formattedValue }) => `${formattedValue}%`,
} satisfies Props;

export const stringDisplay = { value: 1, displayValue: "OK" } satisfies Props;
export const noValue = { value: undefined } satisfies Props;
export const cssWidth = { value: 1, width: "50%" } satisfies Props;

// Every prop is optional
export const noProps = {} satisfies Props;

// @ts-expect-error value must be a number
export const stringValue = { value: "50" } satisfies Props;
// @ts-expect-error stroke is a number of pixels, not a CSS length
export const cssStroke = { value: 1, stroke: "10px" } satisfies Props;
// @ts-expect-error segments need both start and stop
export const halfSegment = { value: 1, segments: [{ start: 0 }] } satisfies Props;
// @ts-expect-error labels are strings
export const numericLabels = { value: 1, labels: [1, 2] } satisfies Props;
