<script lang="ts">
  import { onMount } from "svelte";
  import Gauge from "$lib/Gauge.svelte";
  let value = 0;
  onMount(() => {
    const timer = setInterval(() => {
      value = Math.min(100, Math.round((Date.now() % 12000) / 100));
    }, 500);
    return () => clearInterval(timer);
  });

  const palette = ["#ffffff", "#e41376", "#01c8eec0"];
</script>

<Gauge
  stroke={10}
  width={250}
  labelsCentered={true}
  {value}
  labels={[
    "SwitchBot THX1/W230150X 34EF",
    "Central office",
    "FRITZ!DECT 301 23515 0707002",
  ]}
  color={palette[1]}
  ><Gauge
    stroke={10}
    value={4 * (value % 25)}
    segments={[[45, 55]]}
    color={palette[2]}
  >
    <div>
      <div class="slider-content">
        <span style="white-space:nowrap">20.2</span>
        <span style="white-space:nowrap">45%</span>
      </div>
      <div class="circular8">
        <div>33℃</div>
        <div>🌦</div>
        <div>☀</div>
        <div></div>
        <div>25℃</div>
        <div></div>
        <div>⛈</div>
        <div>☀</div>
      </div>
    </div>
  </Gauge>
</Gauge>

<style lang="scss">
  .slider-content {
    top: 50%;
    left: 50%;
    font-size: calc(var(--gauge-radius) / 2.5);
    transform: translate(-50%, -50%);
    position: absolute;
  }

  .circular8 {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: calc(var(--gauge-radius) / 6);
    opacity: 0.3;
    --radius: calc(var(--gauge-radius) * 0.9 - var(--gauge-stroke));
    > * {
      position: absolute;
      align-content: center;
    }

    /* Place numbers evenly in a circle */
    > :nth-child(1) {
      transform: rotate(calc(0deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(0deg));
    }

    > :nth-child(2) {
      transform: rotate(calc(45deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(-45deg));
    }

    > :nth-child(3) {
      transform: rotate(calc(90deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(-90deg));
    }

    > :nth-child(4) {
      transform: rotate(calc(135deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(-135deg));
    }

    > :nth-child(5) {
      transform: rotate(calc(180deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(-180deg));
    }

    > :nth-child(6) {
      transform: rotate(calc(225deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(-225deg));
    }

    > :nth-child(7) {
      transform: rotate(calc(270deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(-270deg));
    }

    > :nth-child(8) {
      transform: rotate(calc(315deg)) translateY(calc(var(--radius) * -1))
        rotate(calc(-315deg));
    }
  }
</style>
