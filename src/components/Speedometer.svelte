<script lang="ts">
  import { onMount } from "svelte";
  import Gauge from "$lib/Gauge.svelte";
  import { cubicIn, cubicOut } from "svelte/easing";
  const palette = ["#ffffff", "#d43008", "#666666c0"];

  let speed = 0;
  let rpm = 0;

  onMount(() => {
    const timer = setInterval(() => {
      const time = (Date.now() % 6000) / 5000;
      speed = cubicIn(time) * 100;
      rpm = cubicOut(time) * 9000;
    }, 50);
    return () => clearInterval(timer);
  });
</script>

<Gauge
  width={250}
  stop={200}
  labels={Array.from(Array(21), (_, i) => (i % 2 ? "" : (i * 10).toString()))}
  startAngle={45}
  stopAngle={360 - 45}
  stroke={10}
  value={speed}
  color={palette[1]}
>
  <Gauge
    labels={Array.from(Array(11), (_, i) => (i * 1).toString())}
    stop={10000}
    startAngle={45}
    stopAngle={360 - 45}
    stroke={10}
    segments={[{ start: 8000, stop: 10000, color: "#d43008" }]}
    displayValue={Math.round(speed).toString()}
    value={rpm}
    color={palette[2]}
  ></Gauge>
</Gauge>
