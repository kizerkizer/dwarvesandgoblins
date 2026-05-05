import { Vector2, vec2, Rect, toFullAngle, clamp, radToDeg } from "@common/math";
import { rect } from "@common/math/Rect";
import { type GameId, nextId } from "@common/util";
import { JSONObject } from "@common/util/json";
import { IQueuedMessagingServer, INetListener, GameNet } from "@server/net/QueuedMessagingServer";
import { IMessagingServerIdentity, IMessagingServerListener } from "@server/net/server";
import { World } from "@server/simulation/world";

const TICK_DURATION = 50; // ms

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

    public speed = 192 * 2;
    private _connection: IMessagingServerIdentity;

    constructor (game: Game, connection: IMessagingServerIdentity, name: string, position: Vector2) {
        super(game, name, 'player', position, vec2(128, 128));
        this._isPlayer = true;
        this._connection = connection;
    }

    public get connection () {
        return this._connection;
    }

    public get viewRectangle (): Rect {
        const viewSize = vec2(1024, 768);
        return Rect.fromCenter(this.position.add(this.size.scale(0.5)), viewSize.x, viewSize.y);
    }

}

class Goblin extends Entity {

    public speed = 128 * 2;

    constructor (game: Game, name: string, position: Vector2) {
        super(game, name, 'goblin', position, vec2(128, 128));
    }

}

export const granularity = 128; // world units per tile

type InputMessage = {
    type: 'input';
    keys: string;
}

function isInputMessage (message: JSONObject): message is InputMessage {
    return message.type === 'input' && typeof message.keys === 'string';
}


export class Game {
    public static readonly TICK = TICK_DURATION;
    public currentTick: number = 0;
    private _players: Map<IMessagingServerIdentity, Player> = new Map();
    private _world: World;
    private net: GameNet;

    constructor (net: IQueuedMessagingServer) {
        this.net = new GameNet(this, net);
        this._world = new World(this);
    }

    private handleConnections (connections: IMessagingServerIdentity[]) {
        connections.forEach(connection => {
            if (!this._players.has(connection)) {
                const player = new Player(this, connection, `player_${connection.id}`, this.world.origin.clone());
                this._players.set(connection, player);
                this._world.addEntity(player);
                this.net.queueSendMessageReliably(connection, { type: 'welcome', data: { playerId: player.id } });
            }
        });
    }

    private handleMessages (messages: { identity: IMessagingServerIdentity, message: JSONObject }[]) {
        messages.forEach(({ identity, message }) => {
            const player = this._players.get(identity);
            if (player) {
                if (isInputMessage(message)) {
                    const keys = message.keys.split('');
                    let displacement = vec2(0, 0);
                    if (keys.includes('w')) {
                        displacement = displacement.add(vec2(0, -1));
                    }
                    if (keys.includes('a')) {
                        displacement = displacement.add(vec2(-1, 0));
                    }
                    if (keys.includes('s')) {
                        displacement = displacement.add(vec2(0, 1));
                    }
                    if (keys.includes('d')) {
                        displacement = displacement.add(vec2(1, 0));
                    }
                    player.movementDirection = displacement.normalize();
                    player.position = player.position.add(player.movementDirection.scale(player.speed * (Game.TICK / 1000)));
                }
            }
        });
    }

    private sendSnapshots () {
        for (const player of this._players.values()) {
            const snapshot = {
                entities: this._world.entities.map(entity => ({
                    id: entity.id,
                    name: entity.name,
                    kind: entity.kind,
                    position: { x: entity.position.x, y: entity.position.y },
                    size: { x: entity.size.x, y: entity.size.y },
                    orientation: entity.orientation,
                    movementDirection: { x: entity.movementDirection.x, y: entity.movementDirection.y },
                    stats: {
                        health: entity.stats.health,
                        healthMax: entity.stats.healthMax,
                        mana: entity.stats.mana,
                        manaMax: entity.stats.manaMax,
                        stamina: entity.stats.stamina,
                        staminaMax: entity.stats.staminaMax,
                        xp: entity.stats.xp
                    },
                    inventory: {
                        items: entity.inventory.items.map(item => ({
                            kind: item.kind,
                            quantity: item.quantity
                        }))
                    },
                    status: entity.status,
                    isPlayer: entity.isPlayer
                }))
            };
            this.net.queueSendMessage(player.connection, { type: 'snapshot', data: snapshot });
        }
    }

    private handleDisconnects (disconnections: IMessagingServerIdentity[]) {
        disconnections.forEach(disconnection => {
            const player = this._players.get(disconnection);
            if (player) {
                this._world.removeEntity(player);
                this._players.delete(disconnection);
                this.net.queueBroadcastMessageReliably({ type: 'playerDisconnected', data: { playerId: player.id } });
            }
        });
    }

    private initializeFirstTick () {
        // TODO initialize things, spawn goblins
    }

    update (currentTick: number, dt: number) {
        this.currentTick = currentTick;
        if (this.currentTick === 0) {
            this.initializeFirstTick();
        }
        this.handleConnections(this.net.flushConnectQueue());
        this.handleMessages(this.net.flushRecvQueue());
        this.handleDisconnects(this.net.flushDisconnectQueue());
        // Do stuff
        this.sendSnapshots();
        this.net.flushSendQueue();
    }

    public get players () {
        return this._players;
    }

    public get world () {
        return this._world;
    }

    public get entities () {
        return this._world.entities;
    }
};
