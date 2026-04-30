import { Vector2, Rect, clamp, radToDeg } from "@common/math";
import { nextId } from "@common/util";
import * as input from "@client/input";
import { Camera } from "@client/simulation/camera";
import { TICK_DURATION } from "@client/looprunner";

interface IEntityStats {
    health: number;
    mana: number;
    stamina: number;
    xp: number;
}

class EntityStats implements IEntityStats {

    private _health: number = 100;
    private _mana: number = 100;
    private _stamina: number = 100;
    private _xp: number = 0;
    
    constructor (health: number = 100, mana: number = 100, stamina: number = 100, xp: number = 0) {
        this.health = health;
        this.mana = mana;
        this.stamina = stamina;
        this.xp = xp;
    }

    public get health () {
        return this._health;
    }

    public get mana () {
        return this._mana;
    }

    public get stamina () {
        return this._stamina;
    }

    public get xp () {
        return this._xp;
    }

    public set health (value: number) {
        this._health = clamp(Math.floor(value), 0, 100);
    }

    public set mana (value: number) {
        this._mana = clamp(Math.floor(value), 0, 100);
    }
    
    public set stamina (value: number) {
        this._stamina = clamp(Math.floor(value), 0, 100);
    }

    public set xp (value: number) {
        this._xp = Math.max(0, Math.floor(value));
    }

}

interface IItem {
    id: string;
    quantity: number;
}

interface IEntityInventory {
    items: IItem[]; // eventually will be more complex structure player can customize (like placement of items, etc)
}

type EntityStatus =
    | 'idle'
    | 'walking'
    | 'running'
    | 'dead';

export interface IEntity {
    id: number;
    name: string;
    position: Vector2;
    size: Vector2;
    status: EntityStatus;
    orientation: number;
    stats: IEntityStats;
    inventory: IEntityInventory;
}

class Entity implements IEntity {

    protected game: Game;

    protected _id: number;
    protected _name: string;
    protected _position: Vector2 = new Vector2(0, 0);
    protected _size: Vector2 = new Vector2(0, 0);
    protected _orientation: number = 0;
    protected _stats: IEntityStats = new EntityStats();
    protected _inventory: IEntityInventory = { items: [] };
    protected _status: EntityStatus = 'idle';
    protected _isPlayer: boolean = false;

    constructor (game: Game, name: string, position: Vector2, size: Vector2) {
        this.game = game;
        this._id = nextId();
        this._name = name;
        this._position = position;
        this._size = size;
        input.attachEventListeners();
    }

    public get id () {
        return this._id;
    }

    public get name () {
        return this._name;
    }

    public get position () {
        return this._position;
    }

    public set position (value: Vector2) {
        this._position = value;
    }

    public get size () {
        return this._size;
    }

    public set size (value: Vector2) {
        this._size = value;
    }

    public get orientation () {
        return this._orientation;
    }

    public set orientation (value: number) {
        this._orientation = value;
    }

    public get stats () {
        return this._stats;
    }

    public set stats (value: IEntityStats) {
        this._stats = value;
    }

    public get inventory () {
        return this._inventory;
    }

    public set inventory (value: IEntityInventory) {
        this._inventory = value;
    }

    public get status () {
        return this._status;
    }

    public set status (value: EntityStatus) {
        this._status = value;
    }

    public get isPlayer () {
        return this._isPlayer;
    }

}

class Player extends Entity {

    private _isLocalPlayer: boolean = true;
    public speed = 192;

    constructor (game: Game, name: string, position: Vector2, size: Vector2) {
        super(game, name, position, size);
        this._isPlayer = true;
    }

    public get isLocalPlayer () {
        return this._isLocalPlayer;
    }

}

class Tile {
    private _type: number = 0;
    private _tilePosition: Vector2;
    private _bucket: Bucket;
    
    constructor (type: number = 0, bucket: Bucket, tilePosition: Vector2) {
        this._type = type;
        this._bucket = bucket;
        this._tilePosition = tilePosition;
    }

    get type () {
        return this._type;
    }

    get tilePosition () {
        return this._tilePosition;
    }

    get worldPosition () {
        return this._tilePosition.scale(granularity).add(this._bucket.worldPosition);
    }

    get bucket () {
        return this._bucket;
    }
    
}

const granularity = 128; // world units per tile

class Bucket {
    private _entities: Map<number, IEntity> = new Map();
    private _tiles: Uint8Array;
    private _bucketPosition: Vector2;
    private _bucketSize: number;
    private _widthInTiles: number;
    private _heightInTiles: number;
    
    constructor (bucketPosition: Vector2, bucketSize: number) {
        this._bucketPosition = bucketPosition;
        this._bucketSize = bucketSize;
        this._widthInTiles = bucketSize / granularity;
        this._heightInTiles = bucketSize / granularity;
        this._tiles = new Uint8Array(this._widthInTiles * this._heightInTiles);
    }

    addEntity (entity: IEntity) {
        this._entities.set(entity.id, entity);
    }

    removeEntity (entity: IEntity) {
        this._entities.delete(entity.id);
    }

    getTile (tilePosition: Vector2): number {
        if (tilePosition.x < 0 || tilePosition.x >= this._widthInTiles || tilePosition.y < 0 || tilePosition.y >= this._heightInTiles) {
            throw new Error(`Tile position ${tilePosition} is out of bucket bounds`);
        }
        const tileIndex = tilePosition.y * this._widthInTiles + tilePosition.x;
        return this._tiles[tileIndex];
    }

    getTileAsObject (tilePosition: Vector2): Tile {
        const type = this.getTile(tilePosition);
        return new Tile(type, this, tilePosition);
    }

    setTile (tilePosition: Vector2, tile: number) {
        if (tilePosition.x < 0 || tilePosition.x >= this._widthInTiles || tilePosition.y < 0 || tilePosition.y >= this._heightInTiles) {
            throw new Error(`Tile position ${tilePosition} is out of bucket bounds`);
        }
        const tileIndex = tilePosition.y * this._widthInTiles + tilePosition.x;
        this._tiles[tileIndex] = tile;
    }

    get entities(): IEntity[] {
        return Array.from(this._entities.values());
    }

    get tiles(): Uint8Array {
        return this._tiles;
    }

    get tilesAsObjects(): Tile[] {
        const tiles: Tile[] = [];
        for (let y = 0; y < this._heightInTiles; y++) {
            for (let x = 0; x < this._widthInTiles; x++) {
                tiles.push(this.getTileAsObject(new Vector2(x, y)));
            }
        }
        return tiles;
    }

    set tiles (value: Uint8Array) {
        if (value.length !== this._widthInTiles * this._heightInTiles) {
            throw new Error(`Tile array length ${value.length} does not match bucket tile count ${this._widthInTiles * this._heightInTiles}`);
        }
        this._tiles = value;
    }

    get widthInTiles () {
        return this._widthInTiles;
    }
    
    get heightInTiles () {
        return this._heightInTiles;
    }

    get bucketPosition () {
        return this._bucketPosition;
    }

    get worldPosition () {
        return this._bucketPosition.scale(this._bucketSize);
    }

    get bucketSize () {
        return this._bucketSize;
    }
}

export class World {
    private _buckets: Bucket[] = [];
    private _entities: IEntity[] = [];
    public static readonly granularity: number = granularity;
    public static readonly sizeInBuckets: Vector2 = new Vector2(64, 64);
    public static readonly bucketSize: number = 2048;
    public readonly origin: Vector2 = new Vector2(World.bucketSize * World.sizeInBuckets.x / 2, World.bucketSize * World.sizeInBuckets.y / 2);

    constructor (private game: Game, private bucketSize: number = World.bucketSize, private bucketsWidth: number = World.sizeInBuckets.x, private bucketsHeight: number = World.sizeInBuckets.y) {
        for (let y = 0; y < bucketsHeight; y++) {
            for (let x = 0; x < bucketsWidth; x++) {
                const bucket = new Bucket(new Vector2(x, y), bucketSize);
                const tileArray = new Uint8Array(bucket.widthInTiles * bucket.heightInTiles);
                for (let i = 0; i < tileArray.length; i++) {
                    tileArray[i] = Math.floor(Math.random() * 4);
                }
                bucket.tiles = tileArray;
                this._buckets.push(bucket);
            }
        }
    }

    public get entities () {
        return this._entities;
    }

    public get tiles () {
        return this._buckets.map(bucket => bucket.tilesAsObjects).flat();
    }

    addEntity (entity: IEntity) {
        const bucket = this.getBucketByEntity(entity);
        bucket.addEntity(entity);
        this._entities.push(entity);
    }

    repositionEntity (entity: IEntity, newPosition: Vector2) {
        const oldBucket = this.getBucketByEntity(entity);
        const newBucket = this.getBucketByWorldPosition(newPosition);
        if (oldBucket !== newBucket) {
            oldBucket.removeEntity(entity);
            newBucket.addEntity(entity);
        }
        entity.position = newPosition;
    }

    removeEntity (entity: IEntity) {
        const bucket = this.getBucketByEntity(entity);
        bucket.removeEntity(entity);
        const index = this._entities.indexOf(entity);
        if (index !== -1) {
            this._entities.splice(index, 1);
        }
    }

    private getBucketByEntity (entity: IEntity): Bucket {
        return this.getBucketByWorldPosition(entity.position);
    }

    private getBucketByWorldPosition (worldPosition: Vector2): Bucket {
        const xIndex = Math.floor(worldPosition.x / this.bucketSize);
        const yIndex = Math.floor(worldPosition.y / this.bucketSize);
        return this.getBucket(new Vector2(xIndex, yIndex));
    }

    private getBucket (bucketPosition: Vector2): Bucket {
        const xIndex = Math.floor(bucketPosition.x);
        const yIndex = Math.floor(bucketPosition.y);
        if (xIndex < 0 || xIndex >= this.bucketsWidth || yIndex < 0 || yIndex >= this.bucketsHeight) {
            throw new Error(`Position ${bucketPosition} is out of world bounds`);
        }
        return this._buckets[yIndex * this.bucketsWidth + xIndex];
    }

    private getBucketsInRect (worldUnitRect: Rect): Bucket[] {
        const buckets: Bucket[] = [];
        const startXIndex = Math.floor(worldUnitRect.left / this.bucketSize);
        const endXIndex = Math.floor(worldUnitRect.right / this.bucketSize);
        const startYIndex = Math.floor(worldUnitRect.top / this.bucketSize);
        const endYIndex = Math.floor(worldUnitRect.bottom / this.bucketSize);
        for (let yIndex = startYIndex; yIndex <= endYIndex; yIndex++) {
            for (let xIndex = startXIndex; xIndex <= endXIndex; xIndex++) {
                const bucket = this.getBucket(new Vector2(xIndex, yIndex));
                buckets.push(bucket);
            }
        }
        return buckets;
    }

    public getEntitiesInRect (worldUnitRect: Rect): IEntity[] {
        const entities: IEntity[] = [];
        const buckets = this.getBucketsInRect(worldUnitRect);
        for (const bucket of buckets) {
            for (const entity of bucket.entities) {
                if (this.isEntityInRect(entity, worldUnitRect)) {
                    entities.push(entity);
                }
            }
        }
        return entities;
    }

    public getTilesInRect (worldUnitRect: Rect): Tile[] {
        const tiles: Tile[] = [];
        const buckets = this.getBucketsInRect(worldUnitRect);
        for (const bucket of buckets) {
            for (const tile of bucket.tilesAsObjects) {
                const tilePosition = tile.worldPosition;
                if (this.isPositionInRect(tilePosition, worldUnitRect)) {
                    tiles.push(tile);
                }
            }
        }
        return tiles;
    }

    public isPositionInRect (worldPosition: Vector2, worldUnitRect: Rect): boolean {
        return worldPosition.x >= worldUnitRect.left && worldPosition.x < worldUnitRect.right &&
               worldPosition.y >= worldUnitRect.top && worldPosition.y < worldUnitRect.bottom;
    }

    public isEntityInRect (entity: IEntity, worldUnitRect: Rect): boolean {
        return this.isPositionInRect(entity.position, worldUnitRect);
    }

}

export class Game {
    public static readonly TICK = TICK_DURATION;
    private currentTick: number = 0;
    private _camera: Camera;
    private _player: Player;
    private _world: World;

    constructor () {
        this._world = new World(this);
        this._player = new Player(this, 'player', this._world.origin.clone(), new Vector2(256, 256));
        this._camera = new Camera();
        this._camera.x = this._world.origin.x;
        this._camera.y = this._world.origin.y;
        this._camera.zoom = 1;
    }

    update (currentTick: number) {
        this.currentTick = currentTick;
        if (this.currentTick === 0) {
            this._player.position = this._world.origin.clone();
            this._camera.x = this._player.position.x;
            this._camera.y = this._player.position.y;
            this._world.addEntity(this._player);
        }
        this._player.status = 'idle';
        let movementVector = new Vector2(0, 0);
        if (input.keys['w']) {
            movementVector = movementVector.add(new Vector2(0, -1));
            this._player.status = 'walking';
        }
        if (input.keys['a']) {
            movementVector = movementVector.add(new Vector2(-1, 0));
            this._player.status = 'walking';
        }
        if (input.keys['s']) {
            movementVector = movementVector.add(new Vector2(0, 1));
            this._player.status = 'walking';
        }
        if (input.keys['d']) {
            movementVector = movementVector.add(new Vector2(1, 0));
            this._player.status = 'walking';
        }
        const s = this._player.speed / 1000 * 50;
        movementVector = movementVector.normalize().scale(s);
        const newPosition = this._player.position.add(movementVector);
        this._world.repositionEntity(this._player, newPosition);
        const newOrientation = movementVector.fullAngle;
        if (movementVector.x !== 0 || movementVector.y !== 0) {
            this._player.orientation = newOrientation;
        }
        /*const dt = Game.TICK / 1000;
        const lambda = 2.5;
        const q = 1 - Math.exp(-lambda * dt);
        const cameraDisplacement = new Vector2(q * (this._player.position.x - this._camera.x), q * (this._player.position.y - this._camera.y));
        this._camera.x += cameraDisplacement.x;
        this._camera.y += cameraDisplacement.y;
        if (input.wheel.hasChanged) {
            const zoomChange = 1 - input.wheel.deltaY * 0.001;
            this._camera.zoom *= zoomChange;
            this._camera.zoom = clamp(this._camera.zoom, 0.2, 2);
            input.wheel.hasChanged = false;
        }*/
    }

    public get player () {
        return this._player;
    }

    public get camera () {
        return this._camera;
    }

    public get world () {
        return this._world;
    }

    public get entities () {
        return this._world.entities;
    }
};