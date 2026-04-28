export class CanvasManager {
    private _canvas: HTMLCanvasElement;
    
    constructor (container: HTMLElement = document.body) {
        this._canvas = this.createCanvas(container);
        window.addEventListener('resize', () => {
            this.updateCanvas();
        });
    }

    public get canvas () {
        return this._canvas;
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
        window.addEventListener('resize', () => {
            this.updateCanvas();
        });
        return canvas;
    }

    private updateCanvas () {
        const dpr = window.devicePixelRatio || 1;
        this._canvas.width = window.innerWidth * dpr;
        this._canvas.height = window.innerHeight * dpr;
        this._canvas.style.width = `${window.innerWidth}px`;
        this._canvas.style.height = `${window.innerHeight}px`;
        return this._canvas;
    }

}
