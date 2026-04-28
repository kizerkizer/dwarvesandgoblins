import { type IWebGPURenderer } from "./webgpurenderer";

export class RenderLoop {

    private _renderer: IWebGPURenderer;
    private _paused: boolean = false;

    constructor (renderer: IWebGPURenderer) {
        this._renderer = renderer;
    }

    public render (dt: number, progress: number) {
        if (this._paused) {
            return;
        }
        this._renderer.beginFrame();
        this._renderer.render();
        this._renderer.endFrame();
    }

    public pause () {
        this._paused = true;
    }

    public resume () {
        this._paused = false;
    }

}