<script lang="ts">
  import Gauge from "$lib/Gauge.svelte";

  // Jump straight to the value, so tests and screenshots see the final state after one frame
  const jump = () => 1;
  // Hold the value halfway for the whole animation, so a test can tell which easing a change used
  const half = () => 0.5;

  let reactiveValue: number | undefined = 20;
  let reactiveLabels: string[] = [];
  let reactiveEasing = jump;
  let resizeWidth = 180;
  const startString = "10" as unknown as number;
  const strokeString = "1rem" as unknown as number;
</script>

<svelte:head>
  <title>Gauge fixtures</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<h1>Gauge fixtures</h1>
<p>Fixed inputs for the Playwright tests in <code>tests/e2e</code>.</p>

<div class="grid">
  <section data-testid="basic">
    <Gauge width={160} stroke={12} value={25} easing={jump} />
    <p>basic</p>
  </section>

  <section data-testid="no-value">
    <Gauge width={160} stroke={12} value={undefined} easing={jump} />
    <p>no value</p>
  </section>

  <section data-testid="no-value-start">
    <Gauge width={160} stroke={12} start={10} value={undefined} easing={jump} />
    <p>no value, start 10</p>
  </section>

  <section data-testid="labels">
    <Gauge
      width={160}
      stroke={12}
      value={50}
      labels={["A", "B", "C"]}
      easing={jump}
    />
    <p>labels</p>
  </section>

  <section data-testid="labels-centered">
    <Gauge
      width={160}
      stroke={12}
      value={50}
      labels={["A", "B", "C"]}
      labelsCentered
      easing={jump}
    />
    <p>labels centered</p>
  </section>

  <section data-testid="segments">
    <Gauge
      width={160}
      stroke={12}
      value={70}
      segments={[
        { start: 0, stop: 30, color: "#f6a944", label: "Low" },
        { start: 30, stop: 60, color: "#8a9305", label: "Mid" },
        { start: 60, stop: 100, color: "#e62f48", label: "High" },
      ]}
      easing={jump}
    />
    <p>segments</p>
  </section>

  <section data-testid="segments-tuple">
    <Gauge
      width={160}
      stroke={12}
      value={70}
      segments={[
        [0, 30],
        [30, 60],
        [60, 100],
      ]}
      easing={jump}
    />
    <p>tuple segments</p>
  </section>

  <section data-testid="partial">
    <Gauge
      width={160}
      stroke={12}
      value={50}
      startAngle={45}
      stopAngle={315}
      easing={jump}
    />
    <p>partial 45..315</p>
  </section>

  <section data-testid="reverse">
    <Gauge
      width={160}
      stroke={12}
      value={100}
      startAngle={0}
      stopAngle={-270}
      easing={jump}
    />
    <p>reverse 0..-270</p>
  </section>

  <section data-testid="reverse-full">
    <Gauge
      width={160}
      stroke={12}
      value={50}
      startAngle={0}
      stopAngle={-360}
      easing={jump}
    />
    <p>reverse 0..-360</p>
  </section>

  <section data-testid="reversed-range">
    <Gauge
      width={160}
      stroke={12}
      value={25}
      start={100}
      stop={0}
      easing={jump}
    />
    <p>range 100..0</p>
  </section>

  <section data-testid="empty-range">
    <Gauge
      width={160}
      stroke={12}
      value={50}
      start={50}
      stop={50}
      easing={jump}
    />
    <p>range 50..50</p>
  </section>

  <section data-testid="clamped">
    <Gauge width={160} stroke={12} value={150} easing={jump} />
    <p>value above stop</p>
  </section>

  <section data-testid="invalid">
    <Gauge
      width={160}
      value={NaN}
      stroke={NaN}
      startAngle={NaN}
      stopAngle={Infinity}
      easing={jump}
    />
    <p>invalid numbers</p>
  </section>

  <section data-testid="display-string">
    <Gauge
      width={160}
      stroke={12}
      value={40}
      displayValue="OK"
      easing={jump}
    />
    <p>displayValue string</p>
  </section>

  <section data-testid="display-fn">
    <Gauge
      width={160}
      stroke={12}
      value={40}
      displayValue={(v) => `${v.formattedValue} km/h`}
      easing={jump}
    />
    <p>displayValue function</p>
  </section>

  <section data-testid="slot">
    <Gauge width={160} stroke={12} value={30} easing={jump} let:value>
      <span class="slot-value" data-testid="slot-value"
        >{Math.round(value ?? -1)}</span
      >
    </Gauge>
    <p>slot</p>
  </section>

  <section data-testid="styled">
    <Gauge
      width={160}
      stroke={8}
      value={60}
      class="fixture-styled"
      color="crimson"
      easing={jump}
    />
    <p>class and color</p>
  </section>

  <section data-testid="nested">
    <Gauge
      width={200}
      stroke={10}
      value={30}
      labels={["0", "50", "100"]}
      easing={jump}
    >
      <Gauge stroke={10} value={60} easing={jump} />
    </Gauge>
    <p>nested</p>
  </section>

  <section data-testid="auto-size">
    <div style="width: 180px">
      <Gauge stroke={12} value={40} easing={jump} />
    </div>
    <p>sized by container</p>
  </section>

  <section data-testid="string-width">
    <Gauge width="150px" stroke={12} value={40} easing={jump} />
    <p>width "150px"</p>
  </section>

  <section data-testid="reactive">
    <Gauge
      width={160}
      stroke={12}
      value={reactiveValue}
      labels={reactiveLabels}
      easing={reactiveEasing}
    />
    <button on:click={() => (reactiveValue = 80)}>Set 80</button>
    <button on:click={() => ((reactiveEasing = half), (reactiveValue = 80))}
      >Ease to 80 halfway</button
    >
    <button on:click={() => (reactiveLabels = ["A", "B"])}>Add labels</button>
    <button on:click={() => (reactiveValue = Infinity)}>Set Infinity</button>
    <button on:click={() => (reactiveValue = undefined)}>Clear</button>
  </section>

  <section data-testid="resize">
    <div style="width: {resizeWidth}px">
      <Gauge stroke={12} value={40} easing={jump} />
    </div>
    <button on:click={() => (resizeWidth = resizeWidth === 180 ? 120 : 180)}
      >Resize</button
    >
  </section>

  <section data-testid="animated">
    <Gauge width={160} stroke={12} value={75} />
    <p>default animation</p>
  </section>

  <section data-testid="reverse-labels">
    <Gauge
      width={160}
      stroke={12}
      value={50}
      startAngle={0}
      stopAngle={-270}
      labels={["A", "B", "C"]}
      easing={jump}
    />
    <p>reverse with labels</p>
  </section>

  <section data-testid="invalid-range">
    <Gauge
      width={160}
      value={50}
      start={NaN}
      stop={Infinity}
      stroke={-10}
      segments={[
        [NaN, 50],
        [50, Infinity],
      ]}
      easing={jump}
    />
    <p>invalid range and stroke</p>
  </section>

  <section data-testid="non-numbers">
    <Gauge
      width={160}
      value={50}
      start={startString}
      stroke={strokeString}
      easing={jump}
    />
    <p>strings for numbers</p>
  </section>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 220px);
    align-items: start;
    gap: 16px;
    padding: 16px;
  }

  section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 8px;
    font-family: sans-serif;
    font-size: 14px;
    fill: #f0f0f0;
  }

  .slot-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
  }

  p {
    margin: 8px 0 0;
  }
</style>
