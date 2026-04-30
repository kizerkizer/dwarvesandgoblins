import { CanvasManager } from "@client/renderer/canvasmanager";

export interface IWebGPURenderingContext {
    cvs: HTMLCanvasElement;
    ctx: GPUCanvasContext;
    width: number;
    height: number;
    nonDprWidth: number;
    nonDprHeight: number;
    device: GPUDevice | null;
    format: GPUTextureFormat | null;
};

export class WebGPURenderingContext implements IWebGPURenderingContext {

    private canvasManager: CanvasManager;
    private _cvs: HTMLCanvasElement;
    private _ctx: GPUCanvasContext;
    private _width: number; // TODO get rid of these and just compute from canvasManager.canvas.width/height
    private _height: number; // TODO get rid of these and just compute from canvasManager.canvas.width/height

    private _device: GPUDevice | null = null;
    private _format: GPUTextureFormat | null = null;

    private constructor (canvasManager: CanvasManager) {
        this.canvasManager = canvasManager;
        this._cvs = canvasManager.canvas;
        this._width = canvasManager.canvas.width;
        this._height = canvasManager.canvas.height;
        this._ctx = this._cvs.getContext('webgpu') as GPUCanvasContext;
        canvasManager.onResize(() => this.onResize());
    }

    public get nonDprWidth () {
        return this.canvasManager.nonDprWidth;
    }
    
    public get nonDprHeight () {
        return this.canvasManager.nonDprHeight;
    }

    public static async create (canvasManager: CanvasManager): Promise<IWebGPURenderingContext | undefined> {
        const context = new WebGPURenderingContext(canvasManager);
        let adapter: GPUAdapter | null = null;
        try {
            adapter = await navigator.gpu.requestAdapter();
        } catch (e) {
            console.error('Failed to request WebGPU adapter:', e);
            return;
        }
        if (!adapter) {
            console.error('No WebGPU adapter found');
            return;
        }
        context._device = await adapter.requestDevice();
        context._format = navigator.gpu.getPreferredCanvasFormat();
        context._ctx.configure({
            device: context._device,
            format: context._format,
            alphaMode: 'premultiplied',
        });
        return context;
    }

    // Called after CanvasManager resizes the canvas
    private onResize () {
        this._width = this._cvs.width;
        this._height = this._cvs.height;
        if (this._device && this._format) {
            this._ctx.configure({
                device: this._device,
                format: this._format,
                alphaMode: 'premultiplied',
            });
        }
    }

    public get cvs () {
        return this._cvs;
    }

    public get ctx () {
        return this._ctx;
    }

    public get width () {
        return this._width;
    }

    public get height () {
        return this._height;
    }

    public get device () {
        return this._device;
    }

    public get format () {
        return this._format;
    }

};