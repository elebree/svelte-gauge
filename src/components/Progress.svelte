<script lang="ts">
  import Gauge from "$lib/Gauge.svelte";
  let value = 0;
  setInterval(() => {
    value = Math.min(100, Math.round((Date.now() % 12000) / 100));
  });
</script>

<div>
  <Gauge
    class="progress"
    stroke={10}
    displayValue={(v) => v.formattedValue + "%"}
    labels={["∗", "we're doing something important", ""]}
    color="#d43008"
    {value}
  />

  <Gauge
    class="segmented"
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
    width: 125px;

    :global(.gauge-slot-content) {
      color: var(--stroke-color);
    }
    :global(.gauge-pointer) {
      display: none;
    }
  }

  :global(.segmented) {
    width: 125px;

    :global(.gauge-progress) {
      display: none;
    }

    :global(.gauge-pointer) {
      fill: white;
    }
  }
</style>
