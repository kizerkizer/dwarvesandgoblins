import { type AtlasRegistrationOptions, type ISprite, type IWebGPURenderer, WebGPURenderer } from '@client/renderer/webgpurenderer';
import { Rect, Vector2 } from '@common/math';
import { type IRenderable } from '@client/IRenderable';
import { Game } from '@client/simulation/game';

export enum PlayStatus {
    Playing = 'playing',
    Paused = 'paused',
    Stopped = 'stopped',
}

export enum PlayDirection {
    Forward = 'forward',
    Reverse = 'reverse',
}

export interface AnimationRegistrationOptions {
    registrationName: string;
    atlasName: string;
    uvStart: Vector2;
    frameSize: Vector2;
    rows: number;
    cols: number;
    fps: number;
    loop: boolean;
}

export interface AnimationOptions {
    registrationName: string;
    name: string;
    position: Vector2;
    size: Vector2;
    layer: number;
    playDirection: PlayDirection;
}

// TODO A "private" version of this interface should exist, and a 
// class should implement it. That's what should be returned to users.
export interface IRunningAnimation {
    name: string;
    registrationName: string;
    position: Vector2;
    size: Vector2;
    layer: number;
    currentFrame: number;
    elapsedTime: number;
    playStatus: PlayStatus;
    playDirection: PlayDirection;
}

export class Animator implements IRenderable {

    private animationRegistry: Map<string, AnimationRegistrationOptions> = new Map();
    private activeAnimations: IRunningAnimation[] = [];

    constructor (private renderer: IWebGPURenderer) {}

    registerAtlas ({ atlasName, imageBitmap }: AtlasRegistrationOptions): void {
        this.renderer.registerAtlas({
            atlasName,
            imageBitmap,
        });
    }

    registerAnimation (registration: AnimationRegistrationOptions): void {
        this.animationRegistry.set(registration.registrationName, registration);
    }

    addAnimation (animationOptions: AnimationOptions): IRunningAnimation {
        const registration = this.animationRegistry.get(animationOptions.registrationName);
        if (!registration) {
            throw new Error(`Animation "${animationOptions.registrationName}" not registered`);
        }
        const myAnimation: IRunningAnimation = {
            name: animationOptions.name,
            registrationName: registration.registrationName,
            position: animationOptions.position,
            size: animationOptions.size,
            layer: animationOptions.layer,
            currentFrame: 0,
            elapsedTime: 0,
            playStatus: PlayStatus.Playing,
            playDirection: animationOptions.playDirection,
        };
        this.activeAnimations.push(myAnimation);
        return myAnimation;
    }

    removeAnimation (runningAnimation: IRunningAnimation): IRunningAnimation {
        const index = this.activeAnimations.indexOf(runningAnimation);
        if (index !== -1) {
            this.activeAnimations.splice(index, 1);
        }
        return runningAnimation;
    }

    private resolveFrame (dt: number, animation: IRunningAnimation, playStatus: PlayStatus): ISprite {
        animation.elapsedTime += dt;
        const registration = this.animationRegistry.get(animation.registrationName);
        if (!registration) {
            throw new Error(`Animation ${animation.registrationName} not registered`);
        }
        animation.currentFrame = playStatus === PlayStatus.Stopped ? 0 : 
            playStatus === PlayStatus.Paused ? animation.currentFrame :
            Math.floor(animation.elapsedTime / (1000 / registration.fps));
        const col = animation.currentFrame % registration.cols;
        const row = Math.floor(animation.currentFrame / registration.cols) % registration.rows;
        return {
            atlasName: registration.atlasName,
            x: animation.position.x,
            y: animation.position.y,
            w: animation.size.x,
            h: animation.size.y,
            layer: animation.layer,
            u0: registration.uvStart.x + col * registration.frameSize.x,
            v0: registration.uvStart.y + row * registration.frameSize.y,
            u1: registration.uvStart.x + (col + 1) * registration.frameSize.x,
            v1: registration.uvStart.y + (row + 1) * registration.frameSize.y,
        };
    }

    render (dt: number, progress: number) {
        //this.renderer.beginFrame();
        for (const animation of this.activeAnimations) {
            const frame = this.resolveFrame(dt, animation, animation.playStatus);
            this.renderer.drawSprite(frame);
        }
        /*this.renderer.render();
        this.renderer.endFrame();*/
    }
}