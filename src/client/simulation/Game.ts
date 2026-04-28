// TODO

export class Game {
    public static readonly TICK_DURATION = 50; // ms
    private _paused: boolean = false;

    private constructor () {
    }

    public static create (): Game {
        return new Game();
    }

    public pause () {
        this._paused = true;
    }

    public resume () {
        if (!this._paused) {
            this._paused = false;
            //requestAnimationFrame(this.rafTick.bind(this));
        }
    }

    private rafTick (timestamp: DOMHighResTimeStamp) {
        // TODO
        if (this._paused) {
            return;
        }
        //requestAnimationFrame(this.rafTick.bind(this));
        const dt = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        const progress = loop(dt);
        const dt2 = performance.now() - timestamp;
        //render(progress, dt, dt2);
    }

};