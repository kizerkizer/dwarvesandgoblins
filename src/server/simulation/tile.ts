import { Vector2 } from "@common/math";
import { Bucket } from "@server/simulation/bucket";
import { granularity } from "@server/simulation/game";

export class Tile {
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