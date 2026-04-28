// import { Camera } from '@client/renderer/camera';
import { type IWebGPURenderingContext, WebGPURenderingContext } from '@client/renderer/webgpurenderingcontext';
import { type IWebGPURenderer, WebGPURenderer } from '@client/renderer/webgpurenderer';
import { CanvasManager } from '@client/renderer/canvasmanager';

export async function main () {
    const canvasManager = new CanvasManager(document.body);
    const cvs = canvasManager.canvas;
    const renderingContext = await WebGPURenderingContext.create(cvs);
    if (!renderingContext) {
        return;
    }
    const renderer = await WebGPURenderer.create(renderingContext);

    // Test TestAtlas.png
    renderer.registerAtlas({
        atlasName: 'testatlas0',
        imageBitmap: await createImageBitmap(await (await fetch('/resources/TestAtlas.png')).blob()),
    });
    const d1 = {
        atlasName: 'testatlas0',
        w: 189 * 2,
        h: 57 * 2,
        u0: 490 + 2,
        v0: 160 + 2,
        u1: 490 + 189 * 2,
        v1: 160 + 57 * 2,
    };
    const d2 = {
        atlasName: 'testatlas0',
        w: 96,
        h: 221 * 2,
        u0: 588 * 2 + 2,
        v0: 0 + 2,
        u1: 588 * 2 + 96,
        v1: 0 + 221 * 2,
    };
    const d3 = {
        atlasName: 'testatlas0',
        u0: 144 + 2,
        v0: 181 * 2 + 2,
        u1: 144 + 64 * 2,
        v1: 181 * 2 + 64 * 2,
        w: 64 * 2,
        h: 64 * 2,
    };
    const d4 = {
        atlasName: 'testatlas0',
        u0: 74 + 2,
        v0: 74 + 2,
        u1: 74 + 210,
        v1: 74 + 90,
        w: 210,
        h: 90,
    };
    const ds = [d1, d2, d3, d4];
    const { width, height } = renderingContext;
    renderer.beginFrame();
    for (let i = 0; i < 100; i++) {
        const d = ds[Math.floor(Math.random() * ds.length)];
        renderer.drawSprite({
            ...d,
            x: (Math.random() > 0.5 ? 1 : -1) * Math.random() * width / 2,
            y: (Math.random() > 0.5 ? 1 : -1) * Math.random() * height / 2,
        });
    }
    renderer.render();
    renderer.endFrame();
}