<script lang="ts">
  import Gauge from "$lib/Gauge.svelte";
  import { elasticOut } from "svelte/easing";
  let date: Date = new Date(Date.now());

  const palette = ["#f7b5ff", "#e085fd", "#ad54c9"];
  setInterval(() => {
    date = new Date(Date.now());
  }, 500);
</script>

<Gauge
  startAngle={180}
  stopAngle={180 + 360}
  easing={elasticOut}
  value={date.getSeconds()}
  width={250}
  start={0}
  stop={60}
  stroke={10}
  segments={Array.from(Array(12), (_, i) => [5 * i, 5 * i])}
  labels={["XII","I","II","III","IIII","V","VI","VII","VIII","IX","X","XI",""]}
  color={palette[0]}
>
  <Gauge
    startAngle={180}
    stopAngle={180 + 360}
    easing={elasticOut}
    value={date.getMinutes()}
    start={0}
    stop={60}
    stroke={20}
    color={palette[1]}
    ><Gauge
      startAngle={180}
      stopAngle={180 + 360}
      easing={elasticOut}
      value={date.getHours() % 12}
      start={0}
      stop={12}
      stroke={30}
      color={palette[2]}
      ><div
        style={`    top: 50%;
    left: 50%;
    font-size: calc(var(--gauge-radius) / 2.5);
    transform: translate(-50%, -50%);
    position: absolute;`}
      >
        <span style={`color: ${palette[2]};`}
          >{date.getHours().toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
          })}</span
        ><span
          style={`color: ${date.getMilliseconds() < 500 ? palette[0] : "transparent"};`}
          >:</span
        ><span style={`color: ${palette[1]};`}
          >{date.getMinutes().toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
          })}</span
        >
      </div>
    </Gauge>
  </Gauge>
</Gauge>
