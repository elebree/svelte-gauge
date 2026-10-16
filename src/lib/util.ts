// Vite replaces import.meta.env.DEV at build time; other bundlers leave it undefined, so warnings stay off
const DEV = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

// Return the value if it is a finite number not below min, otherwise warn in development and return the fallback
export const finiteOr = <T>(value: unknown, fallback: T, name: string, min = -Infinity): number | T => {
    if (typeof value === "number" && Number.isFinite(value) && value >= min) return value;
    if (DEV) console.warn(`[svelte-gauge] Invalid ${name}: ${String(value)}. Using ${String(fallback)} instead.`);
    return fallback;
};

// Clamp value between min and max
const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

// Map a value in the start..stop range to targetStart..targetStop, clamping it to the range.
// The range may be reversed (start > stop). An empty or non-finite range and a NaN value map to targetStart.
export const scale = (
    value: number,
    start: number,
    stop: number,
    targetStart: number,
    targetStop: number
): number => {
    if (!Number.isFinite(start) || !Number.isFinite(stop) || start === stop || Number.isNaN(value)) {
        return targetStart;
    }
    const clamped = clamp(value, Math.min(start, stop), Math.max(start, stop));
    return targetStart + ((targetStop - targetStart) * (clamped - start)) / (stop - start);
};

// Calculate label offset based on index and total number of labels
export const calcLabelOffset = (
    index: number,
    count: number,
    center: boolean
): number => {
    const c = (count === 1 && !center) ? 0 : (index + (center ? 0.5 : 0)) / (count - (center ? 0 : 1));
    return Math.round((25 + 50 * c) * 100) / 100;
};

// Convert polar coordinates to Cartesian
export const polarToCartesian = (
    radius: number,
    offset: number,
    angle: number
): { x: string; y: string } => {
    const adjustedRadius = radius - offset;
    return {
        x: (radius - adjustedRadius * Math.sin(angle)).toFixed(3),
        y: (radius + adjustedRadius * Math.cos(angle)).toFixed(3),
    };
};

// Generate SVG path for an arc, clockwise when endAngle > startAngle and counterclockwise otherwise
export const calcCurvePath = (radius: number, offset: number, startAngle: number, endAngle: number): string => {
    if (!Number.isFinite(startAngle) || !Number.isFinite(endAngle)) return "";

    const toRadians = (angle: number) => (angle * Math.PI) / 180;
    const startRad = toRadians(startAngle);
    const endRad = toRadians(endAngle);

    const startPoint = polarToCartesian(radius, offset, startRad);

    // Helper to generate an arc command for SVG path
    const arcCommand = (fromAngle: number, toAngle: number): string => {
        const endPoint = polarToCartesian(radius, offset, toAngle);
        const largeArcFlag = Math.abs(toAngle - fromAngle) > Math.PI ? 1 : 0;
        const sweepFlag = toAngle > fromAngle ? 1 : 0;
        return `A ${radius - offset} ${radius - offset} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`;
    };

    // A single SVG arc can't draw a full circle, so split long sweeps into equal parts shorter than 360°
    const sweep = endRad - startRad;
    const parts = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI * 1.9999)));
    let cmd = `M ${startPoint.x} ${startPoint.y}`;
    for (let i = 1; i <= parts; i++) {
        const arcStart = startRad + (sweep * (i - 1)) / parts;
        const arcStop = i === parts ? endRad : startRad + (sweep * i) / parts;
        cmd += ` ${arcCommand(arcStart, arcStop)}`;
    }

    return cmd;
};

// Define a type for the display value handler
export type DisplayValueHandler = (args: {
    value: number | undefined;
    animatedValue: number;
    formattedValue: string;
}) => string;

export type Segment = {
    start: number;
    stop: number;
    color?: string;
    label?: string;
} | [number, number]
