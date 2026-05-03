export interface ICamera {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
}

export class Camera implements ICamera {
    private _data: Float32Array;

    constructor (x: number, y: number, width: number, height: number, zoom: number) {
        this._data = new Float32Array(5);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.zoom = zoom;
    }

    public get data () {
        return this._data;
    }

    public get x () {
        return this._data[2];
    }

    public set x (value: number) {
        this._data[2] = value;
    }

    public get y () {
        return this._data[3];
    }

    public set y (value: number) {
        this._data[3] = value;
    }

    public get zoom () {
        return this._data[4];
    }

    public set zoom (value: number) {
        this._data[4] = value;
    }

    public get width () {
        return this._data[0];
    }

    public set width (value: number) {
        this._data[0] = value;
    }

    public get height () {
        return this._data[1];
    }

    public set height (value: number) {
        this._data[1] = value;
    }

};