import { Vector2, vec2, Rect, toFullAngle, clamp, radToDeg } from "@common/math";
import { type GameId, nextId } from "@common/util";
import { TICK_DURATION } from "@client/looprunner";
import { World } from "@client/simulation/world";
import { createNetClient, INetClient } from "@client/net/net";
import { JSONObject, parse } from '@common/util/json';
import { WT_PORT, WT_URL } from "@client/config";

export interface IEntityStats {
    health: number;
    healthMax: number;
    mana: number;
    manaMax: number;
    stamina: number;
    staminaMax: number;
    xp: number;
}

class EntityStats implements IEntityStats {

    private _health: number = 100;
    private _healthMax: number = 100;
    private _mana: number = 10;
    private _manaMax: number = 10;
    private _stamina: number = 1000;
    private _staminaMax: number = 1000;
    private _xp: number = 0;
    
    constructor (health: number = 100, mana: number = 10, stamina: number = 1000, xp: number = 0) {
        this.health = health;
        this.mana = mana;
        this.stamina = stamina;
        this.xp = xp;
    }

    public get health () {
        return this._health;
    }

    public get healthMax () {
        return this._healthMax;
    }

    public get mana () {
        return this._mana;
    }

    public get manaMax () {
        return this._manaMax;
    }

    public get stamina () {
        return this._stamina;
    }

    public get staminaMax () {
        return this._staminaMax;
    }

    public get xp () {
        return this._xp;
    }

    public damage (amount: number): void {
        this.health = this._health - amount;
    }

    public heal (amount: number): void {
        this.health = this._health + amount;
    }

    public set health (value: number) {
        this._health = clamp(Math.floor(value), 0, this._healthMax);
    }

    public set mana (value: number) {
        this._mana = clamp(Math.floor(value), 0, this._manaMax);
    }
    
    public set stamina (value: number) {
        this._stamina = clamp(Math.floor(value), 0, this._staminaMax);
    }

    public set xp (value: number) {
        this._xp = Math.max(0, Math.floor(value));
    }
}

export interface IItem {
    kind: string;
    quantity: number;
}

export interface IEntityInventory {
    items: IItem[]; // eventually will be more complex structure player can customize (like placement of items, etc)
}

export type EntityStatus =
    | 'idle'
    | 'walking'
    | 'running'
    | 'dead';

export interface IEntity {
    id: GameId;
    name: string;
    kind: string;
    position: Vector2;
    size: Vector2;
    status: EntityStatus;
    orientation: number;
    movementDirection: Vector2;
    stats: IEntityStats;
    inventory: IEntityInventory;
    isPlayer: boolean;
}

class Entity implements IEntity {

    protected game: Game;

    protected _id: GameId;
    protected _name: string;
    protected _kind: string;
    protected _position: Vector2 = vec2(0, 0);
    protected _size: Vector2 = vec2(0, 0);
    protected _orientation: number = 0;
    protected _movementDirection: Vector2 = vec2(0, 0);
    protected _stats: IEntityStats = new EntityStats();
    protected _inventory: IEntityInventory = { items: [] };
    protected _status: EntityStatus = 'idle';
    protected _isPlayer: boolean = false;

    constructor (game: Game, name: string, kind: string, position: Vector2, size: Vector2) {
        this.game = game;
        this._id = nextId();
        this._name = name;
        this._kind = kind;
        this._position = position;
        this._size = size;
    }

    public get movementDirection () {
        return this._movementDirection;
    }

    public set movementDirection (value: Vector2) {
        this._movementDirection = value;
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

    public get kind () {
        return this._kind;
    }

}

class Player extends Entity {

    private _isLocalPlayer: boolean = true;
    public speed = 192 * 2;

    constructor (game: Game, name: string, kind: string, position: Vector2, size: Vector2) {
        super(game, name, kind, position, size);
        this._isPlayer = true;
    }

    public get isLocalPlayer () {
        return this._isLocalPlayer;
    }

}

export const granularity = 128; // world units per tile

const encoder = new TextEncoder(),
    decoder = new TextDecoder();

export class Game {
    public static readonly TICK = TICK_DURATION;
    private currentTick: number = 0;
    private _player: Player;
    private _world: World;
    private _netClient: INetClient;
    private snapshotQueue: any[] = [];
    private input: typeof import('@client/input') | null = null;

    constructor () {
        this._world = new World(this);
        this._player = new Player(this, 'player', 'player', this._world.origin.clone(), vec2(256, 256));
        this._netClient = createNetClient(`${WT_URL}:${WT_PORT}`);
        this._netClient.onReceive((message) => this.handleNetworkMessage(parse(decoder.decode(message))));
    }

    public initialize (input: typeof import('@client/input')) {
        this.input = input;
    }

    private handleNetworkMessage (message: JSONObject) {
        this.snapshotQueue.push(message);
    }

    private handleInputMovePlayer () {
        let displacement = vec2(0, 0);
        if (this.input!.keys['w']) {
            displacement = displacement.add(Vector2.UP);
        }
        if (this.input!.keys['a']) {
            displacement = displacement.add(Vector2.LEFT);
        }
        if (this.input!.keys['s']) {
            displacement = displacement.add(Vector2.DOWN);
        }
        if (this.input!.keys['d']) {
            displacement = displacement.add(Vector2.RIGHT);
        }
        if (!displacement.equals(vec2(0, 0))) {
            this._player.status = 'walking';
            this.player.movementDirection = displacement.normalize();
            const s = this.player.speed / 1000 * 50;
            displacement = displacement.normalize().scale(s);
            const newPosition = this.player.position.add(displacement);
            this.world.repositionEntity(this.player, newPosition);
            const newOrientation = displacement.fullAngle;
            this.player.orientation = newOrientation;
        } else {
            this.player.status = 'idle';
        }
    }

    update (currentTick: number) {
        this.currentTick = currentTick;
        if (this.currentTick === 0) {
            this._player.position = this._world.origin.clone();
            this._world.addEntity(this._player);
        }
        this.handleInputMovePlayer();
    }

    public get player () {
        return this._player;
    }

    public get world () {
        return this._world;
    }

    public get entities () {
        return this._world.entities;
    }
};