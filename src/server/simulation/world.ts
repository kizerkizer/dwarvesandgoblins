import { Bucket } from "@server/simulation/bucket";
import { Game, granularity, IEntity } from "@server/simulation/game";
import { Tile } from "@server/simulation/tile";
import { Vector2, Rect } from "@common/math";

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