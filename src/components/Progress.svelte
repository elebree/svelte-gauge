<script lang="ts">
  import { onMount } from "svelte";
  import Gauge from "$lib/Gauge.svelte";
  let value = 0;
  onMount(() => {
    const timer = setInterval(() => {
      value = Math.min(100, Math.round((Date.now() % 12000) / 100));
    }, 100);
    return () => clearInterval(timer);
  });
</script>

<div>
  <Gauge
    class="progress"
    width={125}
    stroke={10}
    displayValue={(v) => v.formattedValue + "%"}
    labels={["∗", "we're doing something important", ""]}
    color="#d43008"
    {value}
  />

  <Gauge
    class="segmented"
    width={125}
    stroke={15}
    startAngle={40}
    stopAngle={320}
    displayValue=""
    segments={[
      { start: 0, stop: 33, color: "#f6a944", label: "Low" },
      { start: 33, stop: 66, color: "#8a9305", label: "Medium" },
      { start: 66, stop: 100, color: "#e62f48", label: "High" },
    ]}
    color="white"
    {value}
  />
</div>

<style lang="scss">
  :global(.progress) {
    :global(.gauge-slot-content) {
      color: var(--stroke-color);
    }
    :global(.gauge-pointer) {
      display: none;
    }
  }

  :global(.segmented) {
    :global(.gauge-progress) {
      display: none;
    }

    :global(.gauge-pointer) {
      fill: white;
    }
  }
</style>
