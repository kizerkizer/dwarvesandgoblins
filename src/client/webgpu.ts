import shader from './shader.wgsl?raw';

class CanvasManager {
    private _canvas: HTMLCanvasElement;
    
    constructor () {
        this._canvas = this.createCanvas();
        window.addEventListener('resize', () => {
            this.updateCanvas(this._canvas);
        });
    }

    public get canvas () {
        return this._canvas;
    }

    private createCanvas () {
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
        document.body.appendChild(canvas);
        return canvas;
    }

    private updateCanvas (canvas: HTMLCanvasElement) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        return canvas;
    }

}

interface IWebGPURenderingContext {
    cvs: HTMLCanvasElement;
    ctx: GPUCanvasContext;
    width: number;
    height: number;
    device: GPUDevice | null;
    format: GPUTextureFormat | null;
}

class WebGPURenderingContext implements IWebGPURenderingContext {
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

    public static async create (canvas: HTMLCanvasElement): Promise<WebGPURenderingContext | undefined> {
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

}

/*
        this.shaderModule = this.device!.createShaderModule({ code: this.shaderSource });
        
        const instanceBufferLayout: GPUVertexBufferLayout = {
            arrayStride: 4 * 4, // pos(2) + tileX(1) + tileY(1)
            stepMode: 'instance',
            attributes: [
                {
                    shaderLocation: 0, // pos
                    offset: 0,
                    format: 'float32x2',
                },
                {
                    shaderLocation: 1, // tile
                    offset: 8,
                    format: 'uint32x2',
                },
            ],
        };
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: 'vs_main',
                buffers: [instanceBufferLayout],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.format,
                }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });
*/

class Camera {
    public data: Float32Array;

    constructor () {
        this.data = new Float32Array(3);
        this.zoom = 1;
    }

    public get x () {
        return this.data[0];
    }

    public set x (value: number) {
        this.data[0] = value;
    }

    public get y () {
        return this.data[1];
    }

    public set y (value: number) {
        this.data[1] = value;
    }

    public get zoom () {
        return this.data[2];
    }

    public set zoom (value: number) {
        this.data[2] = value;
    }
}

class TileSprite {
    constructor (public x: number, public y: number, public tileX: number, public tileY: number) {
    }
}

interface WebGPUTexture {
    name: string;
    width: number;
    height: number;
    imageBitmap: ImageBitmap;
    texture: GPUTexture;
    bindGroup: GPUBindGroup;
}

type TextureRegistrationOptions =  {
    name: string;
    imageBitmap: ImageBitmap;
    //frameSpans: { name: string; start: number; end: number; frameWidth: number; frameHeight: number }[];
};

class WebGPURenderer {
    private static readonly maxSprites: number = 100_000;
    private context: WebGPURenderingContext;
    private tileSprites: TileSprite[] = [];
    private instanceBuffer: GPUBuffer | null = null;
    private sampler: GPUSampler | null = null;

    public camera: Camera;
    private cameraBuffer: GPUBuffer | null = null;
    private cameraBindGroup: GPUBindGroup | null = null;

    private textureMap: Map<string, WebGPUTexture> = new Map();
    private shaderModule: GPUShaderModule | null = null;
    private pipeline: GPURenderPipeline | null = null;
    private initialized: boolean = false;
    private registrationComplete: boolean = false;

    private constructor (context: WebGPURenderingContext) {
        this.context = context;
        this.camera = new Camera();
    }

    public static async create (context: WebGPURenderingContext): Promise<WebGPURenderer> {
        const renderer = new WebGPURenderer(context);
        await renderer.initialize();
        return renderer;
    }

    public completeRegistration (): void {

        // TODO build shader module and pipeline here, after all textures are registered
        this.registrationComplete = true;
    }

    public registerTexture (options: TextureRegistrationOptions): void {
        if (!this.initialized) {
            throw new Error('Renderer not initialized');
        }
        if (this.registrationComplete) {
            throw new Error('Texture registration already complete');
        }
        const { name, imageBitmap } = options;
        const width = imageBitmap.width,
            height = imageBitmap.height;
        const texture = this.context.device!.createTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.context.device!.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture },
            [width, height]
        );
        const bindGroup = this.context.device!.createBindGroup({
            layout: this.pipeline!.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: texture.createView() },
                { binding: 1, resource: this.sampler! },
            ],
        });
        const webGPUTexture = {
            name,
            width,
            height,
            imageBitmap,
            texture,
            bindGroup,
        };
        this.textureMap.set(name, webGPUTexture);
    }

    private async initialize() {
        this.instanceBuffer = this.context.device!.createBuffer({
            size: WebGPURenderer.maxSprites * 16,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.sampler = this.context.device!.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
        });
        this.cameraBuffer = this.context.device!.createBuffer({
            size: 8 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.cameraBindGroup = this.context.device!.createBindGroup({
            layout: this.pipeline!.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.cameraBuffer,
                    },
                },
            ],
        });
        this.initialized = true;
    }

    public render () {
        if (!this.initialized) return;
        const cameraData = new Float32Array([this.context.width, this.context.height, ...this.camera.data, 0, 0, 0]);
        this.context.device!.queue.writeBuffer(this.cameraBuffer!, 0, cameraData, 0, cameraData.length);
        const instanceData: ArrayBuffer = new ArrayBuffer(this.tileSprites.length * 4 * 4);
        const view = new DataView(instanceData);
        for (let i = 0; i < this.tileSprites.length; i++) {
            const sprite = this.tileSprites[i];
            const base = i * 4 * 4;
            view.setFloat32(base + 0, sprite.x, true);
            view.setFloat32(base + 4, sprite.y, true);
            view.setUint32(base + 8, sprite.tileX, true);
            view.setUint32(base + 12, sprite.tileY, true);
        }
        this.context.device!.queue.writeBuffer(this.instanceBuffer!, 0, instanceData, 0, instanceData.byteLength);
        const commandEncoder = this.context.device!.createCommandEncoder();
        const pass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.ctx.getCurrentTexture().createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        pass.setPipeline(this.pipeline!);
        pass.setVertexBuffer(0, this.instanceBuffer!);
        pass.setBindGroup(0, this.cameraBindGroup!);
        pass.setBindGroup(1, this.atlasBindGroup!);
        if (this.tileSprites.length > WebGPURenderer.maxSprites) {
            throw new Error('Too many sprites');
        }
        pass.draw(6, this.tileSprites.length, 0, 0);
        pass.end();
        this.context.device!.queue.submit([commandEncoder.finish()]);
        this.reset();
    }

    addSprite (sprite: TileSprite) {
        this.tileSprites.push(sprite);
    }

    private reset () {
        //this.tileSprites = [];
    }
}

/*function makeTexureSource (name: string, n: number): string {
    return `
        // Texture "${name}"
        @group(${n + 2}) @binding(0)
        var tex_${n}: texture_2d<f32>;
        var tex_${n}_Width: u32;
        var tex_${n}_Height: u32;
        var tex_${n}_TileSize: u32;

    `;
}*/

export async function main () {
    const canvasManager = new CanvasManager();
    const cvs = canvasManager.canvas;
    const ctx = cvs.getContext('webgpu') as GPUCanvasContext;
    //const shader: string = await fetch('shader.wgsl').then(res => res.text());
    const renderingContext = await WebGPURenderingContext.create(cvs);
    if (!renderingContext) {
        return;
    }
    const renderer = await WebGPURenderer.create(renderingContext);

    window.onwheel = (event) => {
        renderer.camera.zoom *= (1 + event.deltaY * -0.001);
        renderer.render();
    };

    window.onkeydown = (event) => {
        const speed = 10 / renderer.camera.zoom;
        if (event.key === 'w') {
            renderer.camera.y -= speed;
        } else if (event.key === 's') {
            renderer.camera.y += speed;
        } else if (event.key === 'a') {
            renderer.camera.x -= speed;
        } else if (event.key === 'd') {
            renderer.camera.x += speed;
        }
        renderer.render();
    }

    for (let i = 0; i < 1000; i++) {
        const x = Math.floor(Math.random() * cvs.width - cvs.width / 2);
        const y = Math.floor(Math.random() * cvs.height - cvs.height / 2);
        const tileX = Math.floor(Math.random() * 32);
        const tileY = Math.floor(Math.random() * 32);
        renderer.addSprite(new TileSprite(x, y, tileX, tileY));
    }
    /*renderer.addSprite(new TileSprite(100, 100, 8, 1));
    renderer.addSprite(new TileSprite(164, 100, 4, 5));
    renderer.addSprite(new TileSprite(100, 132, 13, 11));
    renderer.addSprite(new TileSprite(132, 132, 4, 5));*/
    renderer.render();
}