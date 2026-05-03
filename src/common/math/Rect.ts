import { Vector2 } from '@common/math/Vector2';

export class Rect {
    private position: Vector2;
    private size: Vector2;

    constructor (position: Vector2, size: Vector2) {
        this.position = position;
        this.size = size;
    }

    toString () {
        return `Rect(position=${this.position.toString()}, size=${this.size.toString()})`;
    }

    public static fromCenter (center: Vector2, width: number, height: number) {
        return new Rect(new Vector2(center.x - width / 2, center.y - height / 2), new Vector2(width, height));
    }

    get topLeft () {
        return this.position;
    }

    set topLeft (value: Vector2) {
        this.position = value;
    }

    get bottomRight () {
        return new Vector2(this.position.x + this.size.x, this.position.y + this.size.y);
    }

    set bottomRight (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x - size.x, value.y - size.y);
    }

    get topRight () {
        return this.position.add(new Vector2(this.size.x, 0));
    }

    set topRight (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x - size.x, value.y);
        this.size = new Vector2(size.x, size.y);
    }

    get bottomLeft () {
        return new Vector2(this.position.x, this.position.y + this.size.y);
    }

    set bottomLeft (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x, value.y - size.y);
    }

    get centerLeft () {
        return new Vector2(this.position.x, this.position.y + this.height / 2);
    }

    set centerLeft (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x, value.y - size.y / 2);
    }

    get centerRight () {
        return new Vector2(this.position.x + this.size.x, this.position.y + this.size.y / 2);
    }

    set centerRight (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x - size.x, value.y - size.y / 2);
    }

    get topCenter () {
        return new Vector2(this.position.x + this.width / 2, this.position.y);
    }

    set topCenter (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x - size.x / 2, value.y);
    }

    get bottomCenter () {
        return new Vector2(this.position.x + this.width / 2, this.position.y + this.height);
    }

    set bottomCenter (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x - size.x / 2, value.y - size.y);
    }

    get width () {
        return this.size.x;
    }

    get height () {
        return this.size.y;
    }

    get top () {
        return this.position.y;
    }

    get left () {
        return this.position.x;
    }

    get right () {
        return this.position.x + this.size.x;
    }

    get bottom () {
        return this.position.y + this.size.y;
    }

    get center () {
        return new Vector2(this.position.x + this.width / 2, this.position.y + this.height / 2);
    }

    set center (value: Vector2) {
        const size = this.size;
        this.position = new Vector2(value.x - size.x / 2, value.y - size.y / 2);
    }

    get area () {
        return this.width * this.height;
    }

    containsPoint (point: Vector2) {
        return point.x >= this.position.x && point.x < this.position.x + this.size.x &&
               point.y >= this.position.y && point.y < this.position.y + this.size.y;
    }

    intersectsRect (rect: Rect) {
        return this.position.x < rect.position.x + rect.size.x && this.position.x + this.size.x > rect.position.x &&
               this.position.y < rect.position.y + rect.size.y && this.position.y + this.size.y > rect.position.y;
    }

    containsRect (rect: Rect) {
        return this.position.x <= rect.position.x && this.position.x + this.size.x >= rect.position.x + rect.size.x &&
               this.position.y <= rect.position.y && this.position.y + this.size.y >= rect.position.y + rect.size.y;
    }
}

export function rect(x: number, y: number, width: number, height: number) {
    return new Rect(new Vector2(x, y), new Vector2(width, height));
}