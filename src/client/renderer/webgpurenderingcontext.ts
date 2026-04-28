export interface IWebGPURenderingContext {
    cvs: HTMLCanvasElement;
    ctx: GPUCanvasContext;
    width: number;
    height: number;
    device: GPUDevice | null;
    format: GPUTextureFormat | null;
};

export class WebGPURenderingContext implements IWebGPURenderingContext {

    private _cvs: HTMLCanvasElement;
    private _ctx: GPUCanvasContext;
    private _width: number;
    private _height: number;

    private _device: GPUDevice | null = null;
    private _format: GPUTextureFormat | null = null;

    private constructor (cvs: HTMLCanvasElement) {
        this._cvs = cvs;
        this._width = cvs.width;
        this._height = cvs.height;
        this._ctx = cvs.getContext('webgpu') as GPUCanvasContext;
    }

    public static async create (canvas: HTMLCanvasElement): Promise<IWebGPURenderingContext | undefined> {
        const context = new WebGPURenderingContext(canvas);
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