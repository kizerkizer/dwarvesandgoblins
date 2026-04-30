export { Vector2 } from "./Vector2";
export { Rect } from "./Rect";
export { LineSegment } from "./LineSegment";

export const TAU = Math.PI * 2;

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

export enum Direction8 {
    North = 'N',
    Northeast = 'NE',
    East = 'E',
    Southeast = 'SE',
    South = 'S',
    Southwest = 'SW',
    West = 'W',
    Northwest = 'NW',
}

export function angleToDirection8 (angle: number): Direction8 {
    type ZeroThroughSeven = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    const octant: ZeroThroughSeven = Math.round(angle / (TAU / 8)) % 8 as ZeroThroughSeven;
    switch (octant) {
        case 0: return Direction8.East;
        case 1: return Direction8.Southeast;
        case 2: return Direction8.South;
        case 3: return Direction8.Southwest;
        case 4: return Direction8.West;
        case 5: return Direction8.Northwest;
        case 6: return Direction8.North;
        case 7: return Direction8.Northeast;
    }
}

export function radToDeg (rad: number) {
    return rad * 180 / Math.PI;
}

export function degToRad (deg: number) {
    return deg * Math.PI / 180;
}