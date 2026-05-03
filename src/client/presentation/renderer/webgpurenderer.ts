import { type ICamera, Camera } from '@client/presentation/presenter/camera';
import { type IWebGPURenderingContext, WebGPURenderingContext } from '@client/presentation/renderer/webgpurenderingcontext';
import shader from './atlas_sprite_shader.wgsl?raw';

interface AtlasEntry {
    atlasName: string;
    width: number;
    height: number;
    imageBitmap: ImageBitmap;
    texture: GPUTexture;
    bindGroup: GPUBindGroup;
};

export type AtlasRegistrationOptions =  {
    atlasName: string;
    imageBitmap: ImageBitmap;
};

export interface IWebGPURenderer {
    camera: ICamera;
    registerAtlas (options: AtlasRegistrationOptions): void;
    drawSprite (sprite: ISprite): void;
    render (): void;
    beginFrame(): void;
    endFrame(): void;
    context: IWebGPURenderingContext;
}

export interface ISprite {
    atlasName: string;
    x: number;
    y: number;
    layer: number;
    w: number;
    h: number;
    u0: number;
    v0: number;
    u1: number;
    v1: number;
}

type WithBufferAndBindGroup<T> = {
    value: T;
    buffer: GPUBuffer;
    bindGroup: GPUBindGroup;
}

export class WebGPURenderer implements IWebGPURenderer {

    public static readonly MAX_SPRITES: number = 10_000;

    private _context: IWebGPURenderingContext;
    private sprites: ISprite[] = [];
    private perLayerSpriteArrays: Map<number, ISprite[]> = new Map();
    private _camera: WithBufferAndBindGroup<ICamera> = { value: null as unknown as ICamera, buffer: null as any, bindGroup: null as any };
    private atlasMap: Map<string, AtlasEntry> = new Map();
    private perAtlasSpriteArrays: Map<string, ISprite[]> = new Map();
    private initialized: boolean = false;

    private spritesInstanceBuffer: GPUBuffer | null = null;
    private sampler: GPUSampler | null = null;
    private shaderModule: GPUShaderModule | null = null;
    private pipeline: GPURenderPipeline | null = null;

    private constructor (context: IWebGPURenderingContext) {
        this._context = context;
    }

    public static async create (context: IWebGPURenderingContext): Promise<IWebGPURenderer> {
        const renderer = new WebGPURenderer(context);
        await renderer.initialize();
        return renderer;
    }

    get context () {
        return this._context;
    }

    public beginFrame (): void {
        this.sprites = [];
        for (const atlasName of this.perAtlasSpriteArrays.keys()) {
            this.perAtlasSpriteArrays.set(atlasName, []);
        }
        // TODO any per-frame setup goes here
    }

    public endFrame (): void {
        // TODO any per-frame cleanup goes here
    }

    public get camera () {
        return this._camera.value;
    }

    public set camera (value: ICamera) {
        this._camera.value = value;
    }

    private addAtlas (atlas: AtlasEntry): void {
        this.atlasMap.set(atlas.atlasName, atlas);
        let spriteArray = this.perAtlasSpriteArrays.get(atlas.atlasName);
        if (spriteArray === undefined) {
            this.perAtlasSpriteArrays.set(atlas.atlasName, []); // new spriteArray
        }
    }

    private createAndCopyTexture (imageBitmap: ImageBitmap): GPUTexture {
        const width = imageBitmap.width,
            height = imageBitmap.height;
        const texture = this._context.device!.createTexture({
            size: [width, height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this._context.device!.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture },
            [width, height]
        );
        return texture;
    }

    public registerAtlas (options: AtlasRegistrationOptions): void {
        if (!this.initialized) {
            throw new Error('Renderer not initialized');
        }
        if (this._camera.value === null) {
            throw new Error('Camera not set');
        }
        const { atlasName, imageBitmap } = options;
        const width = imageBitmap.width,
            height = imageBitmap.height;
        const texture = this.createAndCopyTexture(imageBitmap);
        const bindGroup = this._context.device!.createBindGroup({
            layout: this.pipeline!.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: this.sampler! },
                { binding: 1, resource: texture.createView() },
            ],
        });
        const atlas = {
            atlasName,
            imageBitmap,
            width,
            height,
            texture,
            bindGroup,
        };
        this.addAtlas(atlas);
    }

    private initializePipeline () {
        const instanceBufferLayout: GPUVertexBufferLayout = {
            arrayStride: 8 * 4, // pos(2) + size(2) + uv0(2) + uv1(2)
            stepMode: 'instance',
            attributes: [
                {
                    shaderLocation: 0, // pos
                    offset: 0,
                    format: 'float32x2',
                },
                {
                    shaderLocation: 1, // size
                    offset: 8,
                    format: 'float32x2',
                },
                {
                    shaderLocation: 2, // uv0
                    offset: 16,
                    format: 'float32x2',
                },
                {
                    shaderLocation: 3, // uv1
                    offset: 24,
                    format: 'float32x2',
                },
            ],
        };
        this.pipeline = this._context.device!.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule!,
                entryPoint: 'vs_main',
                buffers: [instanceBufferLayout],
            },
            fragment: {
                module: this.shaderModule!,
                entryPoint: 'fs_main',
                targets: [{
                    format: this._context.format!,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                    }
                }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });
    }

    private initializeCamera () {
        this._camera.buffer = this._context.device!.createBuffer({
            size: 8 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._camera.bindGroup = this._context.device!.createBindGroup({
            layout: this.pipeline!.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this._camera.buffer,
                    },
                },
            ],
        });
    }

    private async initialize () {
        this.shaderModule = this._context.device!.createShaderModule({ code: shader });
        this.spritesInstanceBuffer = this._context.device!.createBuffer({
            size: WebGPURenderer.MAX_SPRITES * 8 * 4,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.sampler = this._context.device!.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
        });
        this.initializePipeline();
        this.initializeCamera();
        this.initialized = true;
    }

    public drawSprite (sprite: ISprite) {
        this.sprites.push(sprite);
        const atlasName = sprite.atlasName;
        const spritesPerAtlas = this.perAtlasSpriteArrays.get(atlasName);
        if (spritesPerAtlas === undefined) {
            throw new Error(`Atlas ${atlasName} not registered`);
        }
        spritesPerAtlas.push(sprite);
        this.perAtlasSpriteArrays.set(atlasName, spritesPerAtlas);
        const layer = sprite.layer;
        const spritesPerLayer = this.perLayerSpriteArrays.get(layer) || [];
        spritesPerLayer.push(sprite);
        this.perLayerSpriteArrays.set(layer, spritesPerLayer);
    }

    private initializePass (commandEncoder: GPUCommandEncoder): GPURenderPassEncoder {
        const pass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this._context.ctx.getCurrentTexture().createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        pass.setPipeline(this.pipeline!);
        pass.setVertexBuffer(0, this.spritesInstanceBuffer!);
        pass.setBindGroup(0, this._camera.bindGroup);
        return pass;
    }

    public render () {
        if (!this.initialized) {
            throw new Error('Renderer not initialized');
        }
        if (this._camera.value === null) {
            throw new Error('Camera not set');
        }
        const { x: cameraX, y: cameraY, width: cameraWidth, height: cameraHeight, zoom } = this._camera.value;
        const cameraData = new Float32Array([cameraWidth, cameraHeight, cameraX, cameraY, zoom, 0]);
        this._context.device!.queue.writeBuffer(this._camera.buffer, 0, cameraData, 0, cameraData.length);
        const commandEncoder = this._context.device!.createCommandEncoder();
        const pass = this.initializePass(commandEncoder);
        if (this.sprites.length > WebGPURenderer.MAX_SPRITES) {
            throw new Error('Too many sprites');
        }
        let instanceOffset = 0;
        const sortedLayers = Array.from(this.perLayerSpriteArrays.keys())
            .sort((a, b) => a - b);
        for (const layer of sortedLayers) {
            for (const atlasName of this.atlasMap.keys()) {
                const atlas = this.atlasMap.get(atlasName)!;
                const spritesForAtlas = this.perAtlasSpriteArrays
                    .get(atlasName)!.filter(sprite => sprite.layer === layer);
                if (spritesForAtlas.length === 0) {
                    continue;
                }
                const instanceData: ArrayBuffer = new ArrayBuffer(spritesForAtlas.length * 8 * 4);
                const view = new DataView(instanceData);
                for (let i = 0; i < spritesForAtlas.length; i++) {
                    const sprite = spritesForAtlas[i];
                    const base = i * 8 * 4;
                    view.setFloat32(base + 0, sprite.x, true);
                    view.setFloat32(base + 4, sprite.y, true);
                    view.setFloat32(base + 8, sprite.w, true);
                    view.setFloat32(base + 12, sprite.h, true);
                    view.setFloat32(base + 16, sprite.u0 / atlas.width, true);
                    view.setFloat32(base + 20, sprite.v0 / atlas.height, true);
                    view.setFloat32(base + 24, sprite.u1 / atlas.width, true);
                    view.setFloat32(base + 28, sprite.v1 / atlas.height, true);
                }

                // Guaranteed that instanceData.byteLength <= 
                // Buffer(spritesForAtlas).byteLength since each instanceData
                // corresponds to subset of spritesForAtlas
                this._context.device!.queue.writeBuffer(this.spritesInstanceBuffer!,
                    instanceOffset, instanceData, 0, instanceData.byteLength);
                pass.setVertexBuffer(0, this.spritesInstanceBuffer!, instanceOffset);
                pass.setBindGroup(1, atlas.bindGroup);
                pass.draw(6, spritesForAtlas.length, 0, 0);
                instanceOffset += instanceData.byteLength;
            }
        }
        pass.end();
        this._context.device!.queue.submit([commandEncoder.finish()]);
    }

}