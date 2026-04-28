export { Vector2 } from "./Vector2";

/**
 * Returns the linear interpolation between start and end by t, clamped to the range [start, end].
 * @param start The start value
 * @param end The end value
 * @param t The interpolation factor, between 0 and 1
 * @returns The interpolated value
 */
export function lerp (start: number, end: number, t: number) {
    return clamp(start + (end - start) * t, start, end);
}

/**
 * Returns the value clamped between min and max.
 * @param value The value to clamp
 * @param min The minimum value
 * @param max The maximum value
 * @returns The clamped value
 */
export function clamp (value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Returns the value wrapped between min and max.
 * @param value The value to wrap
 * @param min The minimum value
 * @param max The maximum value
 * @returns The wrapped value
 */
export function wrap (value: number, min: number, max: number) {
    const range = max - min;
    if (range <= 0) {
        return min;
    }
    let wrappedValue = (value - min) % range;
    if (wrappedValue < 0) {
        wrappedValue += range;
    }
    return wrappedValue + min;
}