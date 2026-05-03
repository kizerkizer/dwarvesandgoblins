import { type Vector2 } from '@common/math';
import { Animator, IClip, PlayDirection, PlayStatus } from './animator';

export interface IRunningAnimationOptions {
    readonly clip: IClip;
    position: Vector2;
    size: Vector2;
    layer: number;
    playStatus: PlayStatus;
    playDirection: PlayDirection;
}

export interface IRunningAnimation extends IRunningAnimationOptions {
    readonly totalFrames: number;
    readonly currentFrame: number;
    readonly elapsedTime: number;
    update (dt: number): void;
    swapClipKeepFrame(newClipName: string): void;
    swapClipResetFrame(newClipName: string): void;
    pause(): void;
    stop(): void;
    play(): void;
    deactivate(): IRunningAnimation;
    activate(): IRunningAnimation;
}

export class RunningAnimation implements IRunningAnimation {
    private _animator: Animator;
    private _clipName: string;
    private _clip: IClip;
    private _position: Vector2;
    private _size: Vector2;
    private _layer: number;
    private _totalFrames: number = 0;
    private _currentFrame: number;
    private _elapsedTime: number;
    private _playStatus: PlayStatus;
    private _playDirection: PlayDirection;

    constructor (animator: Animator, options: IRunningAnimationOptions) {
        this._animator = animator;
        this._clipName = options.clip.clipName;
        this._position = options.position;
        this._size = options.size;
        this._layer = options.layer;
        this._playDirection = options.playDirection;
        this._playStatus = options.playStatus;
        this._clip = options.clip; // To silence TypeScript error
        this.updateNewClip(options.clip);
        this._elapsedTime = 0;
        this._currentFrame = options.playDirection === PlayDirection.Reverse ? this._totalFrames - 1 : 0;
    }

    private updateNewClip (clip: IClip) {
        this._clip = clip;
        this._totalFrames = clip.rows * clip.cols;
    }

    update (dt: number): void {
        const { playStatus } = this;
        const { loop } = this._clip;
        const framesLength = this._totalFrames;
        if (playStatus === PlayStatus.Playing) {
            this._elapsedTime += dt;
        }
        this._currentFrame = 
            playStatus === PlayStatus.Stopped ? 0 : 
            playStatus === PlayStatus.Paused ? this._currentFrame :
            Math.floor(this._elapsedTime / (1000 / this._clip.fps)) % framesLength;
        if (this._playDirection === PlayDirection.Reverse) {
            this._currentFrame = framesLength - 1 - this._currentFrame;
        }
        if (!loop) {
            if (this._playDirection === PlayDirection.Reverse && this._currentFrame === 0) {
                this.pause();
            } else if (this._playDirection === PlayDirection.Forward && this._currentFrame === framesLength - 1) {
                this.pause();
            }
        }
    }

    get clipName (): string {
        return this._clipName;
    }

    get clip (): IClip {
        return this._clip;
    }

    swapClipKeepFrame (newClipName: string) {
        if (newClipName === this._clipName) {
            return;
        }
        const clip = this._animator.getClipByName(newClipName);
        if (!clip) {
            throw new Error(`Animation "${newClipName}" not registered`);
        }
        this._clipName = newClipName;
        this.updateNewClip(clip);
    }

    swapClipResetFrame (newClipName: string) {
        this.swapClipKeepFrame(newClipName);
        this._currentFrame = this._playDirection === PlayDirection.Reverse ? this._totalFrames - 1 : 0;
        this._elapsedTime = 0;
    }

    get position (): Vector2 {
        return this._position;
    }

    set position (pos: Vector2) {
        this._position = pos;
    }

    get size (): Vector2 {
        return this._size;
    }

    set size (size: Vector2) {
        this._size = size;
    }

    get layer (): number {
        return this._layer;
    }

    set layer (layer: number) {
        this._layer = layer;
    }

    get currentFrame (): number {
        return this._currentFrame;
    }

    get elapsedTime (): number {
        return this._elapsedTime;
    }

    get playStatus (): PlayStatus {
        return this._playStatus;
    }

    set playStatus (status: PlayStatus) {
        this._playStatus = status;
    }

    pause () {
        this._playStatus = PlayStatus.Paused;
    }

    stop () {
        this._playStatus = PlayStatus.Stopped;
        if (this._playDirection === PlayDirection.Reverse) {
            this._currentFrame = this._totalFrames - 1;
        } else {
            this._currentFrame = 0;
        }
        this._elapsedTime = 0;
    }

    play () {
        this._playStatus = PlayStatus.Playing;
    }

    get playDirection (): PlayDirection {
        return this._playDirection;
    }

    set playDirection (direction: PlayDirection) {
        this._playDirection = direction;
    }

    get totalFrames (): number {
        return this._totalFrames;
    }

    deactivate(): IRunningAnimation {
        return this._animator.deactivateAnimation(this);
    }

    activate(): IRunningAnimation {
        return this._animator.activateAnimation(this);
    }
}