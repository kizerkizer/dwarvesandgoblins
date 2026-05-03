export interface IUpdatable {
    update (currentTick: number, dt: number): void;
}

export class LoopDriver {
    private _updatable: IUpdatable;
    private _stopped: boolean = false;
    private _tickRate: number;
    private _currentTick: number = 0;
    private _maxCatchup: number = 5;

    constructor (updatable: IUpdatable, tick: number = 50) {
        this._updatable = updatable;
        this._tickRate = tick;
    }

    public get updatable (): IUpdatable {
        return this._updatable;
    }

    public start (): void {
        this._stopped = false;
        let nextTickTime = performance.now() + this._tickRate;
        const loop = () => {
            if (this._stopped) {
                return;
            }
            let now = performance.now();
            let catchup = 0;
            while (now >= nextTickTime && catchup < this._maxCatchup) {
                this._updatable.update(this._currentTick, this._tickRate);
                this._currentTick++;
                nextTickTime += this._tickRate;
                catchup++;
                now = performance.now();
            }
            if (catchup === this._maxCatchup && now >= nextTickTime) {
                nextTickTime = now + this._tickRate;
            }
            setTimeout(loop, Math.max(0, nextTickTime - performance.now()));
        };
        loop();
    }

    public stop (): void {
        this._stopped = true;
    }

}