// import { Camera } from '@client/renderer/camera';
import { type IWebGPURenderingContext, WebGPURenderingContext } from '@client/presentation/renderer/webgpurenderingcontext';
import { type IWebGPURenderer, WebGPURenderer } from '@client/presentation/renderer/webgpurenderer';
import { Animator } from '@client/presentation/animator/animator';
import { Presenter } from '@client/presentation/presenter/presenter';
import { CanvasManager } from '@client/presentation/renderer/canvasmanager';
import { makeGoFullscreenBtn } from '@client/gofullscreen';
import { LoopRunner } from '@client/looprunner';
import { Game } from '@client/simulation/game';
import { IUpdatable } from './IUpdatable';
import { IRenderable } from './IRenderable';
import { Vector2, vec2 } from '@common/math/Vector2';
import * as input from '@client/input';
import manifest from './manifest.json?raw';

export async function main () {
    const canvasManager = new CanvasManager(document.body);
    const goFullscreenBtn = makeGoFullscreenBtn(document.body);
    const cvs = canvasManager.canvas;
    const renderingContext = await WebGPURenderingContext.create(canvasManager);
    if (!renderingContext) {
        return;
    }
    const game = new Game();
    const renderer = await WebGPURenderer.create(renderingContext);
    const animator = new Animator(renderer);
    const presenter = new Presenter(game, renderer, animator);
    renderer.camera = presenter.camera;
    input.attachEventListeners(renderer.camera);
    game.initialize(input);
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
        atlasName: 'tileatlas',
        imageBitmap: await (await fetch('resources/tileatlas.png')).blob().then(createImageBitmap),
    });

    const manifestObject = JSON.parse(manifest);
    for (const entity of manifestObject.entities) {
        for (const animation of entity.animations) {
            const dimensions = {
                frameW: animation.frameW,
                frameH: animation.frameH,
                cols: animation.cols,
                rows: animation.rows,
            };
            if (animation.names) {
                for (const name of animation.names) {
                    const imagePath = `resources/atlases/${entity.name}_${animation.name}_${name}.png`;
                    animator.registerAtlas({
                        atlasName: `${entity.name}.${animation.name}.${name}`,
                        imageBitmap: await (await fetch(imagePath)).blob().then(createImageBitmap),
                    });
                    animator.registerClip({
                        clipName: `${entity.name}.${animation.name}.${name}`,
                        atlasName: `${entity.name}.${animation.name}.${name}`,
                        uvStart: vec2(0, 0),
                        frameSize: vec2(animation.frameW, animation.frameH),
                        rows: animation.rows,
                        cols: animation.cols,
                        fps: animation.fps,
                        loop: animation.loop,
                    });
                }
            }
        }
    }
    loopManager.start();
}