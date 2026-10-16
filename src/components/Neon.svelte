<script lang="ts">
  import Gauge from "$lib/Gauge.svelte";

  let value: number | undefined = 25;
  setInterval(() => {
    value = Math.round(Math.random() * 100);
  }, 1000);
</script>

<div class="neon-container">
  <Gauge
    color="greenyellow"
    labels={[" "]}
    stroke={10}
    class="gauge-dotted"
    width={125}
    displayValue={(v) => v.formattedValue + "dB"}
    {value}
  ></Gauge>
  <Gauge
    color="#5ad2f7"
    labels={[" "]}
    stroke={10}
    startAngle={270}
    stopAngle={90}
    class="gauge-dotted"
    width={125}
    {value}
    displayValue={(v) => v.formattedValue + "%"}
  ></Gauge>
</div>

<style lang="scss">
  :global(.gauge-dotted) {
    color: var(--stroke-color);
    :global(.gauge-background) {
      stroke: #777777;
    }

    :global(.gauge-progress),
    :global(.gauge-background) {
      stroke-dasharray: 2, 4;
      stroke-linecap: butt;
    }

    :global(.gauge-slot-content),
    :global(.gauge-progress),
    :global(.gauge-segment-bg) {
      -webkit-filter: drop-shadow(0px 0px 3px var(--stroke-color));
      filter: drop-shadow(0px 0px 3px var(--stroke-color));
    }

    :global(.gauge-pointer) {
      display: none;
    }
  }
</style>
