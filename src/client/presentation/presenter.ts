import { type IWebGPURenderer, WebGPURenderer } from "@client/renderer/webgpurenderer";
import { Rect, Vector2, angleToDirection8, lerp } from "@common/math";
import { type IEntity, Game, World } from "@client/simulation/game";
import { PlayStatus, PlayDirection, type IRunningAnimation, type AnimationOptions, type AnimationRegistrationOptions, Animator } from "@client/presentation/animator";
import { Transition, transition } from "@client/presentation/transition";
import { type IRenderable } from "@client/IRenderable";
import { type ICamera, Camera } from "@client/simulation/camera";
import { IUpdatable } from "@client/IUpdatable";
import * as input from "@client/input";
import { clamp } from "@common/math";

export class VisualEntity {
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
    private visualCamera: VisualCamera;
    private camera: ICamera;

    constructor (private game: Game, private renderer: IWebGPURenderer, private animator: Animator) {
        this.visualCamera = new VisualCamera(this.game.camera);
        this.camera = new Camera();
        this.camera.x = this.game.world.origin.x;
        this.camera.y = this.game.world.origin.y;
        this.camera.zoom = 1;
    }

    private createNewVisualForEntity (entity: IEntity): VisualEntity {
        const animation = this.animator.addAnimation({
            name: `animation_for_entity_${entity.id}`, // TODO
            registrationName: 'goblin.s', // TODO
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

    private updateVisualCameraFromCamera (visualCamera: VisualCamera, camera: ICamera, progress: number) {
        const positionTransition = visualCamera.positionTransition;
        visualCamera.renderPosition = Vector2.lerp(positionTransition.from, positionTransition.to, progress);
        visualCamera.renderPosition = new Vector2(Math.round(visualCamera.renderPosition.x), Math.round(visualCamera.renderPosition.y));
        const zoomTransition = visualCamera.zoomTransition;
        visualCamera.zoom = lerp(zoomTransition.from, zoomTransition.to, progress);
    }
    
    private updateVisualFromEntity (visual: VisualEntity, entity: IEntity, progress: number) {
        const position = visual.position;
        visual.renderPosition = Vector2.lerp(position.from, position.to, progress);
        const direction = angleToDirection8(entity.orientation);
        const registrationName = `goblin.${direction.toLowerCase()}`;
        visual.animation!.registrationName = registrationName;
        if (entity.status === 'idle') {
            visual.animation!.playStatus = PlayStatus.Stopped;
        } else {
            visual.animation!.playStatus = PlayStatus.Playing;
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
        const q = lambda * dtSec;//1 - Math.exp(-lambda * dtSec);
        const playerPosition = this.getVisualForEntity(this.game.player).renderPosition;
        const delta = new Vector2(q * (playerPosition.x - this.camera.x), q * (playerPosition.y - this.camera.y));
        this.camera.x += delta.x;
        this.camera.y += delta.y;
        //const screenError = delta.magnitude * this.camera.zoom;
        /*if (screenError < 0.25) {
            this.camera.x = playerPosition.x;
            this.camera.y = playerPosition.y;
        }*/
        if (input.wheel.hasChanged) {
            const zoomChange = 1 - input.wheel.deltaY * 0.001;
            this.camera.zoom *= zoomChange;
            this.camera.zoom = clamp(this.camera.zoom, 0.2, 2);
            input.wheel.hasChanged = false;
        }
    }

    render (dt: number, progress: number) {

        //this.updateVisualCameraFromCamera(this.visualCamera, this.game.camera, progress);


        const entities = this.game.entities;
        for (const entity of entities) {
            let visual = this.getVisualForEntity(entity);
            this.updateVisualFromEntity(visual, entity, progress);
        }

        this.updateCamera(dt);

        const origin = this.game.world.origin;
        this.renderer.camera = this.camera;//this.visualCamera;
        this.renderer.beginFrame();
        // TODO delete
        // This should exist in TileMapRenderer or something
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

        this.animator.render(dt, progress);

        this.renderer.render();
        this.renderer.endFrame();
    }
}

