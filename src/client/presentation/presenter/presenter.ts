import { type IWebGPURenderer, WebGPURenderer } from "@client/presentation/renderer/webgpurenderer";
import { Rect, Vector2, angleToDirection8, lerp } from "@common/math";
import { type IEntity, Game } from "@client/simulation/game";
import { PlayStatus, PlayDirection, type IAnimationOptions, type IClipOptions, Animator } from "@client/presentation/animator/animator";
import { type IRunningAnimation } from "@client/presentation/animator/runninganimation";
import { Transition, transition } from "@client/presentation/transition";
import { type IRenderable } from "@client/IRenderable";
import { type ICamera, Camera } from "@client/presentation/presenter/camera";
import { IUpdatable } from "@client/IUpdatable";
import * as input from "@client/input";
import { clamp } from "@common/math";

class VisualEntity {
    private _position: Transition<Vector2>;
    private _animation: IRunningAnimation | null;
    private _simulationEntityId: number;
    private _renderPosition: Vector2;

    constructor (entity: IEntity, animation?: IRunningAnimation) {
        this._simulationEntityId = entity.id;
        this._position = transition(entity.position, entity.position);
        this._renderPosition = entity.position;
        this._animation = animation || null;
    }

    public get renderPosition () {
        return this._renderPosition;
    }
    
    public set renderPosition (value: Vector2) {
        this._renderPosition = value;
        if (this._animation) {
            this._animation.position = value;
        }
    }

    public get simulationEntityId () {
        return this._simulationEntityId;
    }

    public get animation (): IRunningAnimation | null {
        return this._animation;
    }

    public set animation (value: IRunningAnimation) {
        this._animation = value;
    }

    public get position (): Transition<Vector2> {
        return this._position;
    }
}

class VisualCamera implements ICamera {
    private _positionTransition: Transition<Vector2>;
    private _renderPosition: Vector2 = Vector2.ZERO;
    private _zoomTransition: Transition<number>;
    private _renderZoom: number = 1;
    
    constructor (private camera: ICamera) {
        this._positionTransition = transition(new Vector2(camera.x, camera.y), new Vector2(camera.x, camera.y));
        this._zoomTransition = transition(camera.zoom, camera.zoom);
    }

    public get positionTransition () {
        return this._positionTransition;
    }

    // ICamera
    public get x () {
        return this._renderPosition.x;
    }

    // ICamera
    public get y () {
        return this._renderPosition.y;
    }

    // ICamera
    public get zoom () {
        return this._renderZoom;
    }

    public get zoomTransition () {
        return this._zoomTransition;
    }

    public set zoom (value: number) {
        this._renderZoom = value;
    }

    public get renderPosition () {
        return this._renderPosition;
    }

    public set renderPosition (value: Vector2) {
        this._renderPosition = value;
    }
}

export class Presenter implements IRenderable, IUpdatable {

    private entityToVisual: Map<number, VisualEntity> = new Map();
    private _camera: ICamera;

    constructor (private game: Game, private renderer: IWebGPURenderer, private animator: Animator) {
        this._camera = new Camera(
            this.game.world.origin.x,
            this.game.world.origin.y,
            this.renderer.context.nonDprWidth,
            this.renderer.context.nonDprHeight,
            1
        );
        this.renderer.camera = this._camera;
    }

    public get camera () {
        return this._camera;
    }

    private createNewVisualForEntity (entity: IEntity): VisualEntity {
        const animation = this.animator.addAnimation({
            clipName: entity.isPlayer ? 'player.s' : 'd3', // TODO
            position: entity.position,
            size: entity.size,
            layer: 1,
            playDirection: PlayDirection.Forward,
        });
        const visual = new VisualEntity(entity, animation);
        this.entityToVisual.set(entity.id, visual);
        return visual;
    }

    private getVisualForEntity (entity: IEntity): VisualEntity {
        let visual = this.entityToVisual.get(entity.id);
        if (!visual) {
            visual = this.createNewVisualForEntity(entity);
        }
        return visual;
    }
    
    private updateVisualFromEntity (visual: VisualEntity, entity: IEntity, progress: number) {
        const position = visual.position;
        visual.renderPosition = Vector2.lerp(position.from, position.to, progress);
        const direction = angleToDirection8(entity.orientation);
        console.log(direction);
        if (entity.isPlayer) {
            visual.animation!.swapClipKeepFrame(`player.${direction.toLowerCase()}`);
        }
        if (entity.status === 'idle') {
            visual.animation!.playStatus = PlayStatus.Stopped;
        } else {
            visual.animation!.playStatus = PlayStatus.Playing;
        }
        const movementAngle = entity.movementDirection.fullAngle;
        if (Math.abs(movementAngle - entity.orientation) > Math.PI * 0.8 && Math.abs(movementAngle - entity.orientation) < Math.PI * 1.2) {
            visual.animation!.playDirection = PlayDirection.Reverse;
        }
    }

    update (currentTick: number) {
        const entities = this.game.entities;
        for (const entity of entities) {
            let visual = this.getVisualForEntity(entity);
            visual.position.push(entity.position);
        }
    }

    private updateCamera (dtMs: number) {
        const dtSec = dtMs / 1000;
        const lambda = 2.5;
        const q = lambda * dtSec; // 1 - Math.exp(-lambda * dtSec);
        const target = this.getVisualForEntity(this.game.player).renderPosition;
        const delta = new Vector2(q * (target.x - this._camera.x), q * (target.y - this._camera.y));
        this._camera.x += delta.x;
        this._camera.y += delta.y;
        if (input.wheel.hasChanged) {
            const zoomChange = 1 - input.wheel.deltaY * 0.001;
            this._camera.zoom *= zoomChange;
            this._camera.zoom = clamp(this._camera.zoom, 0.2, 2);
            input.wheel.hasChanged = false;
        }
    }

    private renderTilemap () {
        // TODO This should exist in TileMapRenderer or something
        const origin = this.game.world.origin;
        const tl = origin.clone().subtract(new Vector2(2048, 2048));
        const tiles = this.game!.world.getTilesInRect(new Rect(tl, tl.add(new Vector2(4096, 4096))));
        for (const tile of tiles) {
            const u0 = tile.type % 2;
            const v0 = Math.floor(tile.type / 2);
            this.renderer.drawSprite({
                atlasName: 'tileatlas',
                x: tile.worldPosition.x,
                y: tile.worldPosition.y,
                w: 128,
                h: 128,
                layer: 0,
                u0: u0 * 256,
                v0: v0 * 256,
                u1: u0 * 256 + 256,
                v1: v0 * 256 + 256,
            });
        }
    }

    render (dt: number, progress: number) {
        const entities = this.game.entities;
        for (const entity of entities) {
            let visual = this.getVisualForEntity(entity);
            this.updateVisualFromEntity(visual, entity, progress);
        }

        this.updateCamera(dt);

        this.renderer.beginFrame();

        this.renderTilemap();

        this.animator.render(dt, progress);

        this.renderer.render();
        this.renderer.endFrame();
    }
}

