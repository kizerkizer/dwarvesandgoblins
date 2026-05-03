import { type AtlasRegistrationOptions, type ISprite, type IWebGPURenderer, WebGPURenderer } from '@client/presentation/renderer/webgpurenderer';
import { Rect, Vector2 } from '@common/math';
import { type IRenderable } from '@client/IRenderable';
import { type IRunningAnimation, type IRunningAnimationOptions, RunningAnimation } from './runninganimation';

export enum PlayStatus {
    Playing = 'playing',
    Paused = 'paused',
    Stopped = 'stopped',
}

export enum PlayDirection {
    Forward = 'forward',
    Reverse = 'reverse',
}

export interface IClipOptions {
    clipName: string;
    atlasName: string;
    uvStart: Vector2;
    frameSize: Vector2;
    rows: number;
    cols: number;
    fps: number;
    loop: boolean;
}

export interface IClip extends IClipOptions {

}

export interface IAnimationOptions {
    clipName: string;
    position: Vector2;
    size: Vector2;
    layer: number;
    playDirection: PlayDirection;
}

export class Animator implements IRenderable {

    private clipRegistry: Map<string, IClip> = new Map();
    private activeAnimations: IRunningAnimation[] = [];
    private inactiveAnimations: IRunningAnimation[] = [];

    constructor (private renderer: IWebGPURenderer) {}

    registerAtlas ({ atlasName, imageBitmap }: AtlasRegistrationOptions): void {
        this.renderer.registerAtlas({
            atlasName,
            imageBitmap,
        });
    }

    registerClip (registration: IClipOptions): void {
        this.clipRegistry.set(registration.clipName, registration as IClip);
    }

    getClipByName (clipName: string): IClip | undefined {
        return this.clipRegistry.get(clipName);
    }

    addAnimation (animationOptions: IAnimationOptions): IRunningAnimation {
        const clip = this.clipRegistry.get(animationOptions.clipName);
        if (!clip) {
            throw new Error(`Animation "${animationOptions.clipName}" not registered`);
        }
        const animationData: IRunningAnimationOptions = {
            clip,
            position: animationOptions.position,
            size: animationOptions.size,
            layer: animationOptions.layer,
            playStatus: PlayStatus.Playing,
            playDirection: animationOptions.playDirection,
        };
        const animation = new RunningAnimation(this, animationData);
        this.activeAnimations.push(animation);
        return animation;
    }

    removeAnimation (runningAnimation: IRunningAnimation): IRunningAnimation {
        const index = this.activeAnimations.indexOf(runningAnimation);
        if (index !== -1) {
            this.activeAnimations.splice(index, 1);
        }
        return runningAnimation;
    }

    deactivateAnimation (runningAnimation: IRunningAnimation): IRunningAnimation {
        this.removeAnimation(runningAnimation);
        this.inactiveAnimations.push(runningAnimation);
        return runningAnimation;
    }

    activateAnimation (runningAnimation: IRunningAnimation): IRunningAnimation {
        let index = this.inactiveAnimations.indexOf(runningAnimation);
        if (index !== -1) {
            this.inactiveAnimations.splice(index, 1);
        }
        index = this.activeAnimations.indexOf(runningAnimation);
        if (index === -1) {
            this.activeAnimations.push(runningAnimation);
        }
        return runningAnimation;
    }

    private getAnimationCurrentFrame (animation: IRunningAnimation): ISprite {
        const { clip } = animation;
        const { rows, cols } = clip;
        const col = animation.currentFrame % cols;
        const row = Math.floor(animation.currentFrame / cols) % rows;
        return {
            atlasName: clip.atlasName,
            x: animation.position.x,
            y: animation.position.y,
            w: animation.size.x,
            h: animation.size.y,
            layer: animation.layer,
            u0: clip.uvStart.x + col * clip.frameSize.x,
            v0: clip.uvStart.y + row * clip.frameSize.y,
            u1: clip.uvStart.x + (col + 1) * clip.frameSize.x,
            v1: clip.uvStart.y + (row + 1) * clip.frameSize.y,
        };
    }

    private resolveFrame (dt: number, animation: IRunningAnimation): ISprite {
        const clip = this.clipRegistry.get(animation.clip.clipName);
        if (!clip) {
            throw new Error(`Animation ${animation.clip.clipName} not registered`);
        }
        animation.update(dt);
        return this.getAnimationCurrentFrame(animation);
    }

    render (dt: number, progress: number) {
        for (const animation of this.activeAnimations) {
            const frame = this.resolveFrame(dt, animation);
            this.renderer.drawSprite(frame);
        }
    }
}