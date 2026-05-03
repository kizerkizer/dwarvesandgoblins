import { CanvasManager } from "@client/presentation/renderer/canvasmanager";

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

    private _device: GPUDevice | null = null;
    private _format: GPUTextureFormat | null = null;

    private constructor (canvasManager: CanvasManager) {
        this.canvasManager = canvasManager;
        this._cvs = canvasManager.canvas;
        this._ctx = this._cvs.getContext('webgpu') as GPUCanvasContext;
        canvasManager.onResize(() => this.onResize());
    }

    public get nonDprWidth () {
        return this.canvasManager.nonDprWidth;
    }
    
    public get nonDprHeight () {
        return this.canvasManager.nonDprHeight;
    }

    public static async create (canvasManager: CanvasManager): Promise<IWebGPURenderingContext> {
        const context = new WebGPURenderingContext(canvasManager);
        await context.initialize();
        return context;
    }

    private async initialize () {
        let adapter: GPUAdapter | null = null;
        try {
            adapter = await navigator.gpu.requestAdapter();
        } catch (e) {
            throw new Error('Error while requesting WebGPU adapter: ' + (e instanceof Error ? e.message : String(e)));
        }
        if (!adapter) {
            throw new Error('No WebGPU adapter found');
        }
        this._device = await adapter.requestDevice();
        this._format = navigator.gpu.getPreferredCanvasFormat();
        this._ctx.configure({
            device: this._device,
            format: this._format,
            alphaMode: 'premultiplied',
        });
    }

    // Called after CanvasManager resizes the canvas
    private onResize () {
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
        return this.canvasManager.canvas.width;
    }

    public get height () {
        return this.canvasManager.canvas.height;
    }

    public get device () {
        return this._device;
    }

    public get format () {
        return this._format;
    }

};