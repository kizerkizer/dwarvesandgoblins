// import { Camera } from '@client/renderer/camera';
import { type IWebGPURenderingContext, WebGPURenderingContext } from '@client/renderer/webgpurenderingcontext';
import { type IWebGPURenderer, WebGPURenderer } from '@client/renderer/webgpurenderer';
import { Animator } from '@client/presentation/animator';
import { Presenter } from '@client/presentation/presenter';
import { CanvasManager } from '@client/renderer/canvasmanager';
import { makeGoFullscreenBtn } from '@client/gofullscreen';
import { LoopRunner } from '@client/looprunner';
import { Game } from '@client/simulation/game';
import { IUpdatable } from './IUpdatable';
import { IRenderable } from './IRenderable';
import { Vector2 } from '@common/math/Vector2';


export async function main () {
    const canvasManager = new CanvasManager(document.body);
    const goFullscreenBtn = makeGoFullscreenBtn(document.body);
    const cvs = canvasManager.canvas;
    const renderingContext = await WebGPURenderingContext.create(canvasManager);
    if (!renderingContext) {
        return;
    }
    const game = new Game();
    const renderer = await WebGPURenderer.create(renderingContext, game.camera);
    const animator = new Animator(renderer);
    const presenter = new Presenter(game, renderer, animator);
    const loops: IUpdatable & IRenderable = {
        update (currentTick: number) {
            game.update(currentTick);
            presenter.update(currentTick);
        },
        render (dt: number, progress: number) {
            presenter.render(dt, progress);
        },
    }
    const loopManager = new LoopRunner(loops, loops);
    animator.registerAtlas({
        atlasName: 'testatlas0',
        imageBitmap: await (await fetch('resources/TestAtlas.png')).blob().then(createImageBitmap),
    });
    animator.registerAtlas({
        atlasName: 'tileatlas',
        imageBitmap: await (await fetch('resources/tileatlas.png')).blob().then(createImageBitmap),
    })
    animator.registerAtlas({
        atlasName: 'goblin.s',
        imageBitmap: await (await fetch('resources/goblin/s.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.s',
        atlasName: 'goblin.s',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    })
    animator.registerAtlas({
        atlasName: 'goblin.n',
        imageBitmap: await (await fetch('resources/goblin/n.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.n',
        atlasName: 'goblin.n',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    });
    animator.registerAtlas({
        atlasName: 'goblin.e',
        imageBitmap: await (await fetch('resources/goblin/e.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.e',
        atlasName: 'goblin.e',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    });
    animator.registerAtlas({
        atlasName: 'goblin.w',
        imageBitmap: await (await fetch('resources/goblin/w.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.w',
        atlasName: 'goblin.w',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    });
    animator.registerAtlas({
        atlasName: 'goblin.nw',
        imageBitmap: await (await fetch('resources/goblin/nw.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.nw',
        atlasName: 'goblin.nw',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    });
    animator.registerAtlas({
        atlasName: 'goblin.ne',
        imageBitmap: await (await fetch('resources/goblin/ne.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.ne',
        atlasName: 'goblin.ne',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    });
    animator.registerAtlas({
        atlasName: 'goblin.se',
        imageBitmap: await (await fetch('resources/goblin/se.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.se',
        atlasName: 'goblin.se',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    });
    animator.registerAtlas({
        atlasName: 'goblin.sw',
        imageBitmap: await (await fetch('resources/goblin/sw.png')).blob().then(createImageBitmap)
    });
    animator.registerAnimation({
        registrationName: 'goblin.sw',
        atlasName: 'goblin.sw',
        uvStart: new Vector2(0, 0),
        frameSize: new Vector2(256, 256),
        rows: 5,
        cols: 5,
        fps: 24,
        loop: true,
    });
    loopManager.start();
    //window.onresize = () => render(renderingContext, renderer);
}

/*function render (renderingContext: IWebGPURenderingContext, renderer: IWebGPURenderer) {
    const d1 = {
        name: 'd1',
        atlasName: 'testatlas0',
        w: 189 * 2,
        h: 57 * 2,
        u0: 490 + 2,
        v0: 160 + 2,
        u1: 490 + 189 * 2,
        v1: 160 + 57 * 2,
    };
    const d2 = {
        name: 'd2',
        atlasName: 'testatlas0',
        w: 96,
        h: 221 * 2,
        u0: 588 * 2 + 2,
        v0: 0 + 2,
        u1: 588 * 2 + 96,
        v1: 0 + 221 * 2,
    };
    const d3 = {
        name: 'd3',
        atlasName: 'testatlas0',
        u0: 144 + 2,
        v0: 181 * 2 + 2,
        u1: 144 + 64 * 2,
        v1: 181 * 2 + 64 * 2,
        w: 64 * 2,
        h: 64 * 2,
    };
    const d4 = {
        name: 'd4',
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
        let layer = 1;
        if (d.name === 'd4') {
            layer = 2;
        }
        if (d.name === 'd1') {
            layer = 0;
        }
        renderer.drawSprite({
            ...d,
            x: (Math.random() > 0.5 ? 1 : -1) * Math.random() * width / 2,
            y: (Math.random() > 0.5 ? 1 : -1) * Math.random() * height / 2,
            layer,
        });
    }
    renderer.render();
    renderer.endFrame();
}*/