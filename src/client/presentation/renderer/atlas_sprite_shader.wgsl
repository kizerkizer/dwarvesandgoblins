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
var atlasSampler: sampler;

@group(1) @binding(1)
var atlasTex: texture_2d<f32>;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
    @location(0) pos: vec2<f32>,
    @location(1) size: vec2<f32>,
    @location(2) uv0: vec2<f32>,
    @location(3) uv1: vec2<f32>,
};

struct VertexOut {
    @builtin(position) position : vec4f,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main (in: VertexIn) -> VertexOut {
    let corners = array<vec2<f32>, 6>(
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5),
        vec2<f32>( 0.5,  0.5),

        vec2<f32>( 0.5,  0.5),
        vec2<f32>(-0.5,  0.5),
        vec2<f32>(-0.5, -0.5)
    );

    let corner = corners[in.vertexIndex];
    let worldPos = in.pos + corner * in.size;
    let cameraSpace = (worldPos - camera.cameraPos) * camera.zoom;
    let clip = vec2<f32>(
        cameraSpace.x / (camera.screenSize.x * 0.5),
        -cameraSpace.y / (camera.screenSize.y * 0.5)
    );

    let uv01 = corner + vec2<f32>(0.5, 0.5);

    var out: VertexOut;
    out.position = vec4<f32>(clip, 0.0, 1.0);
    out.uv = mix(in.uv0, in.uv1, uv01);
    return out;
}

@fragment
fn fs_main (frag: VertexOut) -> @location(0) vec4f {
    return textureSample(atlasTex, atlasSampler, frag.uv);
}