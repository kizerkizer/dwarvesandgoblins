function createCanvas () {
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
    return canvas;
}

class WebGPURenderingContext {
    public ctx: GPUCanvasContext;
    public width: number;
    public height: number;
    public device: GPUDevice | null = null;
    public pipeline: GPURenderPipeline | null = null;
    private format: GPUTextureFormat | null = null;
    private shaderSource: string;
    private shaderModule: GPUShaderModule | null = null;

    constructor (ctx: GPUCanvasContext, shaderSource: string, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.shaderSource = shaderSource;
    }

    public resize (width: number, height: number) {
        this.width = width;
        this.height = height;
        this.ctx.configure({
            device: this.device!,
            format: this.format!,
            alphaMode: 'premultiplied',
        });
    }

    public async initialize() {
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
        this.device = await adapter.requestDevice();
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.ctx.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        });
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
    }

}

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

class WebGPURenderer {
    private static readonly maxSprites: number = 10_000;
    private context: WebGPURenderingContext;
    private tileSprites: TileSprite[] = [];
    private instanceBuffer: GPUBuffer | null = null;
    public camera: Camera;
    private cameraBuffer: GPUBuffer | null = null;
    private cameraBindGroup: GPUBindGroup | null = null;
    private minecraftAtlas: ImageBitmap | null = null;
    private minecraftAtlasTexture: GPUTexture | null = null;
    private atlasBindGroup: GPUBindGroup | null = null;
    private initialized: boolean = false;

    constructor (context: WebGPURenderingContext) {
        this.context = context;
        this.camera = new Camera();
    }

    public async initialize() {
        this.minecraftAtlas = await fetch('resources/minecraftx2.png').then(res => res.blob()).then(blob => createImageBitmap(blob));
        this.minecraftAtlasTexture = this.context.device!.createTexture({
            size: [this.minecraftAtlas!.width, this.minecraftAtlas!.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.context.device!.queue.copyExternalImageToTexture(
            { source: this.minecraftAtlas! },
            { texture: this.minecraftAtlasTexture! },
            [this.minecraftAtlas!.width, this.minecraftAtlas!.height]
        );
        this.instanceBuffer = this.context.device!.createBuffer({
            size: WebGPURenderer.maxSprites * 16,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        const sampler = this.context.device!.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
        });
        this.atlasBindGroup = this.context.device!.createBindGroup({
            layout: this.context.pipeline!.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: this.minecraftAtlasTexture!.createView() },
                { binding: 1, resource: sampler },
            ],
        });
        this.cameraBuffer = this.context.device!.createBuffer({
            size: 8 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.cameraBindGroup = this.context.device!.createBindGroup({
            layout: this.context.pipeline!.getBindGroupLayout(0),
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
        pass.setPipeline(this.context.pipeline!);
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

const shader = /*wgsl*/ `
struct Camera {
    screenSize: vec2<f32>,
    cameraPos: vec2<f32>,
    zoom: f32,
    _pad0: f32,
    _pad1: f32,
    _pad2: f32,
};

const atlasWidth: u32 = 64;
const atlasHeight: u32 = 32;
const tileSize: u32 = 32;

@group(0) @binding(0)
var<uniform> camera: Camera;

@group(1) @binding(0)
var atlasTex: texture_2d<f32>;

@group(1) @binding(1)
var atlasSampler: sampler;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
    @location(0) pos: vec2<f32>,
    @location(1) tile: vec2<u32>,
};

struct VertexOut {
    @builtin(position) position : vec4f,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main (in: VertexIn) -> VertexOut {
    var corners = array<vec2<f32>, 6>(
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5),
        vec2<f32>( 0.5,  0.5),

        vec2<f32>( 0.5,  0.5),
        vec2<f32>(-0.5,  0.5),
        vec2<f32>(-0.5, -0.5)
    );

    let corner = corners[in.vertexIndex];
    let spriteSize = vec2<f32>(f32(tileSize), f32(tileSize));
    let worldPos = in.pos + corner * spriteSize;
    let cameraSpace = (worldPos - camera.cameraPos) * camera.zoom;
    let clip = vec2<f32>(
        cameraSpace.x / (camera.screenSize.x * 0.5),
        -cameraSpace.y / (camera.screenSize.y * 0.5)
    );

    var out: VertexOut;
    out.position = vec4<f32>(clip, 0.0, 1.0);

    let uv01 = corner + vec2<f32>(0.5, 0.5);
    let tileSizeUV = vec2<f32>(
        1.0 / f32(atlasWidth),
        1.0 / f32(atlasHeight),
    );
    let uvBase = vec2<f32>(
        f32(in.tile.x) * tileSizeUV.x,
        f32(in.tile.y) * tileSizeUV.y
    );
    out.uv = uvBase + uv01 * tileSizeUV;

    return out;
}

@fragment
fn fs_main (frag: VertexOut) -> @location(0) vec4f {
    return textureSample(atlasTex, atlasSampler, frag.uv);
}
`;

export async function main () {
    const cvs = createCanvas();
    document.body.appendChild(cvs);
    const ctx = cvs.getContext('webgpu') as GPUCanvasContext;
    //const shader: string = await fetch('shader.wgsl').then(res => res.text());
    const renderingContext = new WebGPURenderingContext(ctx, shader, cvs.width, cvs.height);
    await renderingContext.initialize();
    const renderer = new WebGPURenderer(renderingContext);
    await renderer.initialize();

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