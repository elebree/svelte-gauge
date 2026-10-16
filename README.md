# Svelte Gauge

[![npm](https://img.shields.io/npm/v/svelte-gauge.svg)](https://www.npmjs.com/package/svelte-gauge)
[![downloads](https://img.shields.io/npm/dw/svelte-gauge)](https://www.npmjs.com/package/svelte-gauge)
[![bundle size](https://deno.bundlejs.com/badge?q=svelte-gauge)](https://bundlejs.com/?q=svelte-gauge)
[![tests](https://github.com/elebree/svelte-gauge/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/elebree/svelte-gauge/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/svelte-gauge.svg)](LICENSE)

A customizable and animated gauge component built with Svelte, perfect for visualizing progress, performance metrics, or other numerical data.

[<img width="100%" alt="svelte.gauge preview" src="images/banner.png">](https://elebree.github.io/svelte-gauge/)

## 🎮 Demo

Experience the Svelte Gauge in action:
[Try it in the Svelte Playground](https://svelte.dev/playground/8e9390da303a4e33a5e53d431ed0df94?version=5.9.0)

## 📦 Installation

Install the package via pnpm:

```bash
pnpm add svelte-gauge
```

## 🛠 Usage

Import the component and use it in your Svelte application:

```Svelte
<script>
  import Gauge from "svelte-gauge";
</script>

<Gauge
  value={value}
  start={0}
  stop={100}
  stroke={20}
  color={"red"}
  labels={["One", "Two", "Three"]}
  segments={[
    [0, 33],
    [34, 66],
    [67, 100],
  ]}
  width={300}
  class="custom-gauge"
/>

```

### Server-side rendering

A gauge with a numeric `width` (for example `width={300}`) renders its full SVG on the server and in prerendered pages. So do gauges nested in its slot, which start at the slot's size. Any other gauge, sized by CSS or its container (including `width="50%"`), renders only after the browser has measured it.
