export class CanvasManager {
    private _canvas: HTMLCanvasElement;
    private _resizeCallbacks: ((canvasManager: CanvasManager) => void)[] = [];
    private _nonDprWidth: number;
    private _nonDprHeight: number;
    
    constructor (container: HTMLElement = document.body) {
        this._canvas = this.createCanvas(container);
        this._nonDprWidth = window.innerWidth;
        this._nonDprHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            this.updateCanvas();
            this._resizeCallbacks.forEach(cb => cb(this));
        });
    }

    public get canvas () {
        return this._canvas;
    }

    public get nonDprWidth () {
        return this._nonDprWidth;
    }
    
    public get nonDprHeight () {
        return this._nonDprHeight;
    }

    private createCanvas (container: HTMLElement) {
        const canvas = document.createElement('canvas'),
            dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        Object.assign(canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
        });
        container.appendChild(canvas);
        return canvas;
    }

    private updateCanvas () {
        const dpr = window.devicePixelRatio || 1;
        this._canvas.width = window.innerWidth * dpr;
        this._canvas.height = window.innerHeight * dpr;
        this._canvas.style.width = `${window.innerWidth}px`;
        this._canvas.style.height = `${window.innerHeight}px`;
        this._nonDprWidth = window.innerWidth;
        this._nonDprHeight = window.innerHeight;
        return this._canvas;
    }

    public onResize (callback: (canvasManager: CanvasManager) => void) {
        this._resizeCallbacks.push(callback);
    }

}
