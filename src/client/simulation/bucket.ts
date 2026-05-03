import { Vector2 } from "@common/math";
import { granularity, IEntity } from "@client/simulation/game";
import { Tile } from "@client/simulation/tile";
import { GameId } from "@common/util";

export class Bucket {
    private _entities: Map<GameId, IEntity> = new Map();
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