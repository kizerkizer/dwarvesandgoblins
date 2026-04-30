import { Vector2 } from "@common/math/Vector2";

export class LineSegment {

    constructor (private _start: Vector2, private _end: Vector2) {}
    
    [Symbol.iterator]() {
        let index = 0;
        const start = this._start,
            end = this._end;
        return {
            next(): IteratorResult<Vector2> {
                if (index === 0) {
                    index++;
                    return { value: start, done: false };
                }
                if (index === 1) {
                    index++;
                    return { value: end, done: false };
                }
                return { value: undefined, done: true };
            }
        };
    }

    [Symbol.isConcatSpreadable] = true;

    get start () {
        return this._start;
    }

    get end () {
        return this._end;
    }

    get startPoint () {
        return this.start;
    }

    get endPoint () {
        return this.end;
    }

    get length () {
        return this.start.distanceTo(this.end);
    }

    get midpoint () {
        return new Vector2((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);
    }

    rotateAboutMidpoint (angle: number) {
        const mid = this.midpoint;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const startX = this.start.x - mid.x;
        const startY = this.start.y - mid.y;
        const endX = this.end.x - mid.x;
        const endY = this.end.y - mid.y;
        const rotatedStartX = startX * cosAngle - startY * sinAngle;
        const rotatedStartY = startX * sinAngle + startY * cosAngle;
        const rotatedEndX = endX * cosAngle - endY * sinAngle;
        const rotatedEndY = endX * sinAngle + endY * cosAngle;
        this._start = new Vector2(rotatedStartX + mid.x, rotatedStartY + mid.y);
        this._end = new Vector2(rotatedEndX + mid.x, rotatedEndY + mid.y);
    }

    rotateAboutStart (angle: number) {
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const endX = this.end.x - this.start.x;
        const endY = this.end.y - this.start.y;
        const rotatedEndX = endX * cosAngle - endY * sinAngle;
        const rotatedEndY = endX * sinAngle + endY * cosAngle;
        this._end = new Vector2(rotatedEndX + this.start.x, rotatedEndY + this.start.y);
    }

    rotateAboutEnd (angle: number) {
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const startX = this.start.x - this.end.x;
        const startY = this.start.y - this.end.y;
        const rotatedStartX = startX * cosAngle - startY * sinAngle;
        const rotatedStartY = startX * sinAngle + startY * cosAngle;
        this._start = new Vector2(rotatedStartX + this.end.x, rotatedStartY + this.end.y);
    }

    get angle () {
        return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
    }

    get fullAngle () {
        const angle = this.angle;
        return angle >= 0 ? angle : (Math.PI * 2 + angle);
    }

    intersectionPoint (other: LineSegment): Vector2 | null {

        // Thank you GitHub Copilot for this code snippet,
        // I would have never come up with it myself
        const x1 = this.start.x;
        const y1 = this.start.y;
        const x2 = this.end.x;
        const y2 = this.end.y;
        const x3 = other.start.x;
        const y3 = other.start.y;
        const x4 = other.end.x;
        const y4 = other.end.y;

        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) {
            if ((y4 - y3) * (x2 - x1) === (x4 - x3) * (y2 - y1)) {

                // Lines are collinear, check for overlap
                const overlap = (x1 <= x4 && x2 >= x3) || (x1 >= x4 && x2 <= x3) || (y1 <= y4 && y2 >= y3) || (y1 >= y4 && y2 <= y3);
                if (overlap) {

                    // Return the midpoint of the overlapping segment as the intersection point
                    const midX = (Math.max(x1, x3) + Math.min(x2, x4)) / 2;
                    const midY = (Math.max(y1, y3) + Math.min(y2, y4)) / 2;
                    return new Vector2(midX, midY);
                }
            }
            return null; // Lines are parallel and noncollinear, or collinear but non-overlapping
        }

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return new Vector2(x1 + ua * (x2 - x1), y1 + ua * (y2 - y1));
        }

        return null; // No intersection within the line segments
    }

}