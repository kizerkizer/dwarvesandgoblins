import { Vector2 } from '@common/math/Vector2';

export class Rect {
    constructor (private tl: Vector2, private br: Vector2) {}

    toString () {
        return `Rect(tl=${this.tl.toString()}, br=${this.br.toString()})`;
    }

    get topLeft () {
        return this.tl;
    }

    set topLeft (value: Vector2) {
        const wh = this.whVector;
        this.tl = value;
        this.br = new Vector2(this.tl.x + wh.x, this.tl.y + wh.y);
    }

    get bottomRight () {
        return this.br;
    }

    set bottomRight (value: Vector2) {
        const wh = this.whVector;
        this.br = value;
        this.tl = new Vector2(this.br.x - wh.x, this.br.y - wh.y);
    }

    get topRight () {
        return new Vector2(this.br.x, this.tl.y);
    }

    set topRight (value: Vector2) {
        const wh = this.whVector;
        this.tl = new Vector2(value.x - wh.x, value.y);
        this.br = new Vector2(value.x, value.y + wh.y);
    }

    get bottomLeft () {
        return new Vector2(this.tl.x, this.br.y);
    }

    set bottomLeft (value: Vector2) {
        const wh = this.whVector;
        this.tl = new Vector2(value.x, value.y - wh.y);
        this.br = new Vector2(value.x + wh.x, value.y);
    }

    get centerLeft () {
        return new Vector2(this.tl.x, this.tl.y + this.height / 2);
    }

    set centerLeft (value: Vector2) {
        const wh = this.whVector;
        this.tl = new Vector2(value.x, value.y - wh.y / 2);
        this.br = new Vector2(value.x + wh.x, value.y + wh.y / 2);
    }

    get centerRight () {
        return new Vector2(this.br.x, this.tl.y + this.height / 2);
    }

    set centerRight (value: Vector2) {
        const wh = this.whVector;
        this.tl = new Vector2(value.x - wh.x, value.y - wh.y / 2);
        this.br = new Vector2(value.x, value.y + wh.y / 2);
    }

    get topCenter () {
        return new Vector2(this.tl.x + this.width / 2, this.tl.y);
    }

    set topCenter (value: Vector2) {
        const wh = this.whVector;
        this.tl = new Vector2(value.x - wh.x / 2, value.y);
        this.br = new Vector2(value.x + wh.x / 2, value.y + wh.y);
    }

    get bottomCenter () {
        return new Vector2(this.tl.x + this.width / 2, this.br.y);
    }

    set bottomCenter (value: Vector2) {
        const wh = this.whVector;
        this.tl = new Vector2(value.x - wh.x / 2, value.y - wh.y);
        this.br = new Vector2(value.x + wh.x / 2, value.y);
    }

    get width () {
        return this.br.x - this.tl.x;
    }

    get height () {
        return this.br.y - this.tl.y;
    }

    get top () {
        return this.tl.y;
    }

    get left () {
        return this.tl.x;
    }

    get right () {
        return this.br.x;
    }

    get bottom () {
        return this.br.y;
    }

    get whVector () {
        return new Vector2(this.width, this.height);
    }

    get center () {
        return new Vector2(this.tl.x + this.width / 2, this.tl.y + this.height / 2);
    }

    set center (value: Vector2) {
        const wh = this.whVector;
        this.tl = new Vector2(value.x - wh.x / 2, value.y - wh.y / 2);
        this.br = new Vector2(value.x + wh.x / 2, value.y + wh.y / 2);
    }

    get area () {
        return this.width * this.height;
    }

    containsPoint (point: Vector2) {
        return point.x >= this.tl.x && point.x < this.br.x &&
               point.y >= this.tl.y && point.y < this.br.y;
    }

    intersectsRect (rect: Rect) {
        return this.tl.x < rect.br.x && this.br.x > rect.tl.x &&
               this.tl.y < rect.br.y && this.br.y > rect.tl.y;
    }

    containsRect (rect: Rect) {
        return this.tl.x <= rect.tl.x && this.br.x >= rect.br.x &&
               this.tl.y <= rect.tl.y && this.br.y >= rect.br.y;
    }
}