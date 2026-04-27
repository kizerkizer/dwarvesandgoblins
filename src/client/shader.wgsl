struct Camera {
    screenSize: vec2<f32>,
    cameraPos: vec2<f32>,
    zoom: f32,
    _pad0: f32,
    _pad1: f32,
    _pad2: f32,
};

@group(0) @binding(0)
var<uniform> camera: Camera;

@group(1) @binding(0)
var textureSampler: sampler;

@group(2) @binding(0)
var tex: texture_2d<f32>;
@group(2) @binding(1)
var<uniform> texWidth: u32;
@group(2) @binding(2)
var<uniform> texHeight: u32;
@group(2) @binding(3)
var<uniform> texTileSize: u32;

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