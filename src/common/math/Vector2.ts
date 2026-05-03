export class Vector2 {

    constructor (private _x: number, private _y: number) {}

    public static readonly ZERO = new Vector2(0, 0);
    public static readonly UP = new Vector2(0, -1);
    public static readonly DOWN = new Vector2(0, 1);
    public static readonly LEFT = new Vector2(-1, 0);
    public static readonly RIGHT = new Vector2(1, 0);

    public static fromAngleMagnitude (angle: number, magnitude: number) {
        return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }

    public static lerp (start: Vector2, end: Vector2, t: number) {
        return new Vector2(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t);
    }

    toString () {
        return `<${this._x}, ${this._y})>`;
    }

    [Symbol.iterator]() {
        let index = 0;
        const x = this._x,
            y = this._y;
        return {
            next(): IteratorResult<number> {
                if (index === 0) {
                    index++;
                    return { value: x, done: false };
                }
                if (index === 1) {
                    index++;
                    return { value: y, done: false };
                }
                return { value: undefined, done: true };
            }
        };
    }

    [Symbol.isConcatSpreadable] = true;

    get x () {
        return this._x;
    }
    
    get y () {
        return this._y;
    }

    get 0 () {
        return this._x;
    }

    get 1 () {
        return this._y;
    }

    get length () {
        return 2;
    }

    scale (value: number) {
        return new Vector2(this._x * value, this._y * value);
    }

    add (vector2d: Vector2) {
        return new Vector2(this._x + vector2d._x, this._y + vector2d._y);
    }

    subtract (vector2d: Vector2) {
        return new Vector2(this._x - vector2d._x, this._y - vector2d._y);
    }

    get magnitude () {
        return Math.sqrt(this._x * this._x + this._y * this._y);
    }

    distanceTo (vector2d: Vector2) {
        return vector2d.subtract(this).magnitude;
    }

    get angle () {
        return Math.atan2(this._y, this._x);
    }

    get fullAngle () {
        const angle = this.angle;
        return angle >= 0 ? angle : (Math.PI * 2 + angle);
    }

    normalize () {
        const magnitude = this.magnitude;
        if (magnitude > 0) {
            return new Vector2(this._x / magnitude, this._y / magnitude);
        }
        return new Vector2(0, 0);
    }

    clone () {
        return new Vector2(this._x, this._y);
    }

    equals (other: Vector2) {
        return this._x === other._x && this._y === other._y;
    }
}

export function vec2 (x: number, y: number) {
    return new Vector2(x, y);
}