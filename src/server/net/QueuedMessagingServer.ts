import { IMessagingServer, IMessagingServerIdentity, IMessagingServerListener } from './server';
import * as messagecodec from '@server/net/messagecodec';
import { JSONObject } from '@common/util/json';
import { Game } from '@server/simulation/game';

export interface INetListener {
    onConnect? (identity: IMessagingServerIdentity): void;
    onDisconnect? (identity: IMessagingServerIdentity): void;
    onMessage? (identity: IMessagingServerIdentity, message: JSONObject): void;
}

export interface INetMessage {
    type: string;
    serverTick?: number;
    data: JSONObject;
}

export interface IQueuedMessagingServer {
    queueSendMessage (identity: IMessagingServerIdentity, message: INetMessage): void;
    queueSendMessageReliably (identity: IMessagingServerIdentity, message: INetMessage): void;
    listen (listener: INetListener): number;
    removeListener (listenerId: number): void;
    flushRecvQueue (): { identity: IMessagingServerIdentity, message: JSONObject }[];
    flushConnectQueue (): IMessagingServerIdentity[];
    flushDisconnectQueue (): IMessagingServerIdentity[];
    flushSendQueue (): void;
}

export class QueuedMessagingServer implements IQueuedMessagingServer {
    private _messagingServer: IMessagingServer;
    private _connections: Map<string | number, IMessagingServerIdentity> = new Map();
    private _connectQueue: IMessagingServerIdentity[] = [];
    private _disconnectQueue: IMessagingServerIdentity[] = [];
    private _recvMessageQueue: { identity: IMessagingServerIdentity, message: JSONObject }[] = [];
    private _sendMessageQueue: { identity: IMessagingServerIdentity, reliable: boolean, message: Uint8Array }[] = [];

    constructor (gameServer: IMessagingServer) {
        this._messagingServer = gameServer;
    }

    private onConnect (identity: IMessagingServerIdentity) {
        this._connections.set(identity.id, identity);
        this._connectQueue.push(identity);
    }

    private onDisconnect (identity: IMessagingServerIdentity) {
        this._connections.delete(identity.id);
        this._disconnectQueue.push(identity);
    }

    private onMessage (identity: IMessagingServerIdentity, message: Uint8Array, reliable: boolean) {
        this._recvMessageQueue.push({ identity, message: messagecodec.decodeMessage(message) });
    }

    public queueSendMessage (identity: IMessagingServerIdentity, message: INetMessage) {
        const encodedMessage = messagecodec.encodeMessage(message as unknown as JSONObject);
        this._sendMessageQueue.push({ identity, reliable: false, message: encodedMessage });
    }

    public queueSendMessageReliably (identity: IMessagingServerIdentity, message: INetMessage) {
        const encodedMessage = messagecodec.encodeMessage(message as unknown as JSONObject);
        this._sendMessageQueue.push({ identity, reliable: true, message: encodedMessage });
    }

    public listen (listener: INetListener): number {
        return this._messagingServer.listen({
            onConnect: (identity) => {
                this.onConnect(identity);
                if (listener.onConnect) {
                    listener.onConnect(identity);
                }
            },
            onDisconnect: (identity) => {
                this.onDisconnect(identity);
                if (listener.onDisconnect) {
                    listener.onDisconnect(identity);
                }
            },
            onMessage: (identity, message, reliable) => {
                this.onMessage(identity, message, reliable);
                if (listener.onMessage) {
                    listener.onMessage(identity, messagecodec.decodeMessage(message));
                }
            },
        });
    }

    public removeListener (listenerId: number): void {
        this._messagingServer.removeListener(listenerId);
    }

    public flushRecvQueue (): { identity: IMessagingServerIdentity, message: JSONObject }[] {
        const queue = [...this._recvMessageQueue];
        this._recvMessageQueue = [];
        return queue;
    }

    public flushConnectQueue (): IMessagingServerIdentity[] {
        const queue = [...this._connectQueue];
        this._connectQueue = [];
        return queue;
    }

    public flushDisconnectQueue (): IMessagingServerIdentity[] {
        const queue = [...this._disconnectQueue];
        this._disconnectQueue = [];
        return queue;
    }

    public flushSendQueue () {
        this._sendMessageQueue.forEach(({ identity, message, reliable }) => {
            if (reliable) {
                this._messagingServer.sendMessageReliably(identity, message);
            } else {
                this._messagingServer.sendMessage(identity, message);
            }
        });
        this._sendMessageQueue = [];
    }

}

export class GameNet implements IQueuedMessagingServer {
    
    constructor (private game: Game, private net: IQueuedMessagingServer) {}

    queueSendMessage(identity: IMessagingServerIdentity, message: INetMessage): void {
        message.serverTick = this.game.currentTick;
        this.net.queueSendMessage(identity, message);
    }

    queueSendMessageReliably(identity: IMessagingServerIdentity, message: INetMessage): void {
        message.serverTick = this.game.currentTick;
        this.net.queueSendMessageReliably(identity, message);
    }

    flushRecvQueue(): { identity: IMessagingServerIdentity; message: JSONObject; }[] {
        return this.net.flushRecvQueue();
    }

    flushConnectQueue(): IMessagingServerIdentity[] {
        return this.net.flushConnectQueue();
    }

    flushDisconnectQueue(): IMessagingServerIdentity[] {
        return this.net.flushDisconnectQueue();
    }

    flushSendQueue(): void {
        return this.net.flushSendQueue();
    }

    queueBroadcastMessage (message: INetMessage): void {
        message.serverTick = this.game.currentTick;
        this.game.players.forEach(player => {
            this.queueSendMessage(player.connection, message);
        });
    }

    queueBroadcastMessageReliably (message: INetMessage): void {
        message.serverTick = this.game.currentTick;
        this.game.players.forEach(player => {
            this.queueSendMessageReliably(player.connection, message);
        });
    }

    listen (listener: INetListener): number {
        return this.net.listen(listener);
    }

    removeListener (listenerId: number): void {
        this.net.removeListener(listenerId);
    }
}