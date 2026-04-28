export class Camera {
    private _data: Float32Array;

    constructor () {
        this._data = new Float32Array(3);
        this.zoom = 1;
    }

    public get data () {
        return this._data;
    }

    public get x () {
        return this._data[0];
    }

    public set x (value: number) {
        this._data[0] = value;
    }

    public get y () {
        return this._data[1];
    }

    public set y (value: number) {
        this._data[1] = value;
    }

    public get zoom () {
        return this._data[2];
    }

    public set zoom (value: number) {
        this._data[2] = value;
    }
};