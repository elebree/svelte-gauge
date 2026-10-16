<script lang="ts">
  import { onMount } from "svelte";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import {
    calcCurvePath,
    calcLabelOffset,
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
  let visible = false;

  // Check if any label is present
  const border = labels.some(Boolean) ? 16 : 0;
  const uuid = Math.random().toString(36).slice(-6);

  // Animated value with easing
  const animatedValue = tweened(start, { duration: 1000, easing });
  $: animatedValue.set(value ?? 0);

  // Set visibility on mount for animations
  onMount(() => (visible = true));
</script>

<div
  class={`gauge-container ${className ?? ""}`}
  bind:clientWidth
  bind:clientHeight
  style="
    {width ? `width: ${typeof width === 'string' ? width : width + 'px'};` : ''}
    {`--gauge-stroke: ${typeof stroke === 'string' ? stroke : stroke + 'px'};`}
    {color !== undefined ? `--stroke-color: ${color};` : ''}
    {`--gauge-border: ${border}px;`}
--gauge-radius: {Math.min(clientWidth, clientHeight) / 2}px"
>
  {#if clientWidth > 0 && clientHeight > 0}
    {@const radius = Math.min(clientWidth, clientHeight) / 2}
    {@const borderAdjusted = border + stroke / 2}
    {@const handlePos = polarToCartesian(
      radius,
      borderAdjusted,
      scale($animatedValue, start, stop, startAngle, stopAngle) *
        (Math.PI / 180)
    )}

    <svg class="gauge-visual" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {#each segments as segment, index (index)}
          <path
            id={`segment-${index}-${uuid}`}
            d={calcCurvePath(
              radius,
              borderAdjusted,
              scale(
                "start" in segment ? segment.start : segment[0],
                start,
                stop,
                startAngle,
                stopAngle
              ),
              scale(
                "stop" in segment ? segment.stop : segment[1],
                start,
                stop,
                startAngle,
                stopAngle
              )
            )}
          />
        {/each}
        <path
          id="labels-path-{uuid}"
          d={calcCurvePath(
            radius,
            border - 2,
            startAngle - (stopAngle - startAngle) / 2,
            stopAngle + (stopAngle - startAngle) / 2
          )}
        />
      </defs>

      <!-- Labels -->
      {#if visible}
        <text class="gauge-labels">
          {#each labels as label, index (index)}
            <textPath
              xlink:href="#labels-path-{uuid}"
              startOffset="{calcLabelOffset(
                index,
                labels.length,
                labelsCentered
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
                  value,
                  animatedValue: $animatedValue,
                  formattedValue:
                    $animatedValue === 0 && value === undefined
                      ? "NaN"
                      : Math.round($animatedValue).toString(),
                })}
          </text>
        {/if}
      {/if}

      <!-- Background arc -->
      <path
        class="gauge-background"
        d={calcCurvePath(radius, borderAdjusted, startAngle, stopAngle)}
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
      {#if value != undefined || $animatedValue != 0}
        <path
          class="gauge-progress"
          d={calcCurvePath(
            radius,
            borderAdjusted,
            startAngle,
            scale($animatedValue, start, stop, startAngle, stopAngle)
          )}
        />
      {/if}

      <!-- Handle -->
      {#if value != undefined || $animatedValue != 0}
        <circle
          class="gauge-pointer"
          cx={handlePos.x}
          cy={handlePos.y}
          r={stroke / 2}
        />
      {/if}
    </svg>
    <!-- Slot Content -->
    {#if !!$$slots.default}
      <div class="gauge-slot-container">
        <slot
          value={$animatedValue === 0 && value === undefined
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
