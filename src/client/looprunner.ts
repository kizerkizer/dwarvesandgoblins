import { IRenderable } from "./IRenderable";
import { IUpdatable } from "./IUpdatable";

export const TICK_DURATION = 50; // ms

export class LoopRunner {

    private _currentTick: number = 0;
    private _paused: boolean = false;

    constructor (private updatable: IUpdatable, private renderable: IRenderable) {}

    start () {
        this._paused = false;
        let lastTimestamp = performance.now();
        let accumulator = 0;
        const loop = (timestamp: DOMHighResTimeStamp) => {
            if (this._paused) {
                return;
            }
            requestAnimationFrame(loop);
            const dt = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            accumulator += dt;
            while (accumulator >= TICK_DURATION) {
                accumulator -= TICK_DURATION;
                this.updatable.update(this._currentTick);
                this._currentTick++;
            }
            const progress = accumulator / TICK_DURATION;
            this.renderable.render(dt, progress);
        };
        requestAnimationFrame(loop);
    }

    pause () {
        this._paused = true;
    }

    get currentTick () {
        return this._currentTick;
    }

    get paused () {
        return this._paused;
    }

};