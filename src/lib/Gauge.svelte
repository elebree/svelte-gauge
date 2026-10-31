<script lang="ts">
  import { getContext, setContext } from "svelte";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { writable, type Readable } from "svelte/store";
  import {
    calcCurvePath,
    calcLabelOffset,
    finiteOr,
    polarToCartesian,
    scale,
    type DisplayValueHandler,
    type Segment,
  } from "./util.js";

  export let easing: (v: number) => number = cubicOut;
  export let value: number | undefined;
  export let displayValue: string | DisplayValueHandler = (v) =>
    v.formattedValue;
  export let width: number | string | undefined = undefined;
  export let start: number = 0;
  export let stop: number = 100;
  export let startAngle: number = 0;
  export let stopAngle: number = 360;
  export let stroke: number = 20;
  export let labels: string[] = [];
  export let labelsCentered: boolean = false;
  export let segments: Segment[] = [];
  let className: string | undefined = undefined;
  export { className as class };
  export let color: string | undefined = undefined;

  let clientWidth: number;
  let clientHeight: number;

  // Gauges in this gauge's slot start at the slot's size until they are measured
  const SLOT_SIZE = "svelte-gauge:slot-size";
  const parentSlotSize = getContext<Readable<number> | undefined>(SLOT_SIZE);
  const slotSize = writable(0);
  setContext(SLOT_SIZE, slotSize);

  // The measured size; until the container is measured (and on the server),
  // a numeric width or the slot size of the gauge this one is nested in
  $: size =
    clientWidth > 0 && clientHeight > 0
      ? Math.min(clientWidth, clientHeight)
      : typeof width === "number" && Number.isFinite(width) && width > 0
        ? width
        : ($parentSlotSize ?? 0);
  // The slot container is inset by the stroke and the label border on each side
  $: slotSize.set(Math.max(0, size - 2 * (safeStroke + border)));

  // Check if any label is present
  const border = labels.some(Boolean) ? 16 : 0;
  const uuid = Math.random().toString(36).slice(-6);

  // Invalid numeric props fall back to their defaults instead of producing NaN geometry
  $: safeValue = value == null ? undefined : finiteOr(value, undefined, "value");
  $: safeStart = finiteOr(start, 0, "start");
  $: safeStop = finiteOr(stop, 100, "stop");
  $: safeStartAngle = finiteOr(startAngle, 0, "startAngle");
  $: safeStopAngle = finiteOr(stopAngle, 360, "stopAngle");
  $: safeStroke = finiteOr(stroke, 20, "stroke", 0);

  // Animated value with easing
  const animatedValue = tweened(Number.isFinite(start) ? start : 0, {
    duration: 1000,
    easing,
  });
  $: animatedValue.set(safeValue ?? 0);

  // The animated value and the segment bounds as angles in degrees
  $: valueAngle = scale(
    $animatedValue,
    safeStart,
    safeStop,
    safeStartAngle,
    safeStopAngle
  );
  $: segmentAngles = segments.map((segment) =>
    [
      "start" in segment ? segment.start : segment[0],
      "stop" in segment ? segment.stop : segment[1],
    ].map((v) => scale(v, safeStart, safeStop, safeStartAngle, safeStopAngle))
  );
</script>

<div
  class={`gauge-container ${className ?? ""}`}
  bind:clientWidth
  bind:clientHeight
  style="
    {width ? `width: ${typeof width === 'string' ? width : width + 'px'};` : ''}
    {`--gauge-stroke: ${safeStroke}px;`}
    {color !== undefined ? `--stroke-color: ${color};` : ''}
    {`--gauge-border: ${border}px;`}
    {size > 0 ? `--gauge-radius: ${size / 2}px;` : ''}"
>
  {#if size > 0}
    {@const radius = size / 2}
    {@const borderAdjusted = border + safeStroke / 2}
    {@const handlePos = polarToCartesian(
      radius,
      borderAdjusted,
      valueAngle * (Math.PI / 180)
    )}
    {@const labelsReversed = safeStopAngle < safeStartAngle}
    {@const labelSweep = Math.abs(safeStopAngle - safeStartAngle)}

    <!-- The viewBox matches the size, so a prerendered gauge scales if CSS shrinks its container -->
    <svg
      class="gauge-visual"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 {size} {size}"
      preserveAspectRatio="xMinYMin meet"
    >
      <defs>
        {#each segmentAngles as [from, to], index (index)}
          <path
            id={`segment-${index}-${uuid}`}
            d={calcCurvePath(radius, borderAdjusted, from, to)}
          />
        {/each}
        <path
          id="labels-path-{uuid}"
          d={calcCurvePath(
            radius,
            border - 2,
            Math.min(safeStartAngle, safeStopAngle) - labelSweep / 2,
            Math.max(safeStartAngle, safeStopAngle) + labelSweep / 2
          )}
        />
      </defs>

      <!-- Labels -->
      <text class="gauge-labels">
        {#each labels as label, index (index)}
          <textPath
            xlink:href="#labels-path-{uuid}"
            startOffset="{calcLabelOffset(
              index,
              labels.length,
              labelsCentered,
              labelsReversed
            )}%"
            text-anchor="middle"
          >
            {label}
          </textPath>
        {/each}
      </text>

      <!-- Display Value -->
      {#if !$$slots.default}
        <text class="gauge-slot-content" x="50%" y="50%">
          {typeof displayValue === "string"
            ? displayValue
            : displayValue({
                value: safeValue,
                animatedValue: $animatedValue,
                formattedValue:
                  $animatedValue === 0 && safeValue === undefined
                    ? "NaN"
                    : Math.round($animatedValue).toString(),
              })}
        </text>
      {/if}

      <!-- Background arc -->
      <path
        class="gauge-background"
        d={calcCurvePath(radius, borderAdjusted, safeStartAngle, safeStopAngle)}
      />

      <!-- Segments -->
      {#each segments as segment, index (index)}
        <g
          style={"color" in segment && segment.color
            ? `--segment-color: ${segment.color}`
            : ""}
        >
          <use href="#segment-{index}-{uuid}" class="gauge-segment-bg" />
          <use href="#segment-{index}-{uuid}" class="gauge-segment" />
          {#if "label" in segment && segment.label}
            <text class="gauge-segment-label">
              <textPath startOffset="50%" xlink:href="#segment-{index}-{uuid}">
                {segment.label}
              </textPath>
            </text>
          {/if}
        </g>
      {/each}

      <!-- Progress arc -->
      {#if safeValue != undefined || $animatedValue != 0}
        <path
          class="gauge-progress"
          d={calcCurvePath(radius, borderAdjusted, safeStartAngle, valueAngle)}
        />
      {/if}

      <!-- Handle -->
      {#if safeValue != undefined || $animatedValue != 0}
        <circle
          class="gauge-pointer"
          cx={handlePos.x}
          cy={handlePos.y}
          r={safeStroke / 2}
        />
      {/if}
    </svg>
    <!-- Slot Content -->
    {#if !!$$slots.default}
      <div class="gauge-slot-container">
        <slot
          value={$animatedValue === 0 && safeValue === undefined
            ? undefined
            : $animatedValue}
        />
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  @use "./Gauge.scss";
</style>
