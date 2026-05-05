import { RNG, SeededRNG } from '../../common/math/rng';
import { INetClient } from './net';

export interface INetworkProfile {
    nextClientToServerDelay: () => number; // -1 indicates drop packet
    nextServerToClientDelay: () => number; // -1 indicates drop packet
}

abstract class NetworkProfile implements INetworkProfile {
    constructor (protected rng: RNG) {}
    abstract nextClientToServerDelay (): number;
    abstract nextServerToClientDelay (): number;
}

export class MediocreNetworkProfile extends NetworkProfile {
    private countToNextSpike: number = 0;
    private readonly base: number = 85;
    private readonly packetDropRate: number = 0.05;
    private delay: () => number;

    constructor (rng: RNG) {
        super(rng);
        this.countToNextSpike = rng.nextInt(65, 85);
        this.delay = () => {
            let noise = this.rng.nextInt(-7, 5);
            if (this.countToNextSpike === 0) {
                this.countToNextSpike = this.rng.nextInt(65, 85);
                noise += this.rng.nextInt(230, 470);
            }
            this.countToNextSpike--;
            if (this.rng.nextFloat() < this.packetDropRate) {
                return -1;
            }
            return this.base + noise;
        };
    }

    nextClientToServerDelay ()  {
        return this.delay!();
    }

    nextServerToClientDelay () {
        return this.delay!();
    }
}

export class PoorNetworkProfile extends NetworkProfile {
    private countToNextSpike: number = 0;
    private readonly base: number = 85;
    private readonly packetDropRate: number = 0.15;
    private delay: () => number;

    constructor (rng: RNG) {
        super(rng);
        this.countToNextSpike = rng.nextInt(25, 45);
        this.delay = () => {
            let noise = this.rng.nextInt(-7, 5);
            if (this.countToNextSpike === 0) {
                this.countToNextSpike = this.rng.nextInt(25, 45);
                noise += this.rng.nextInt(430, 770);
            }
            this.countToNextSpike--;
            if (this.rng.nextFloat() < this.packetDropRate) {
                return -1;
            }
            return this.base + noise;
        };
    }

    nextClientToServerDelay ()  {
        return this.delay!();
    }

    nextServerToClientDelay () {
        return this.delay!();
    }

}

export const mediocreNetworkProfile = new MediocreNetworkProfile(new SeededRNG(0xdeadbeef));
export const poorNetworkProfile = new PoorNetworkProfile(new SeededRNG(0xdeadbeef));

export class FakeNetworkBridge {
    private networkProfile: INetworkProfile;
    private serverReceiveHandlers: ((message: string) => void)[] = [];
    private clientReceiveHandlers: ((message: string) => void)[] = [];

    constructor (networkProfile: INetworkProfile) {
        this.networkProfile = networkProfile;
    }

    addServerReceiveHandler (handler: (message: string) => void) {
        this.serverReceiveHandlers.push(handler);
    }

    removeServerReceiveHandler (handler: (message: string) => void) {
        this.serverReceiveHandlers.splice(this.serverReceiveHandlers.indexOf(handler), 1);
    }

    addClientReceiveHandler (handler: (message: string) => void) {
        this.clientReceiveHandlers.push(handler);
    }

    removeClientReceiveHandler (handler: (message: string) => void) {
        this.clientReceiveHandlers.splice(this.clientReceiveHandlers.indexOf(handler), 1);
    }

    sendToServer (message: string) {
        setTimeout(() => {
            this.dispatchMessage(message, this.serverReceiveHandlers);
        }, this.networkProfile.nextClientToServerDelay());
    }

    sendToClient (message: string) {
        setTimeout(() => {
            this.dispatchMessage(message, this.clientReceiveHandlers);
        }, this.networkProfile.nextServerToClientDelay());
    }

    private dispatchMessage (message: string, handlers: ((message: string) => void)[]) {
        for (const handler of handlers) {
            handler(message);
        }
    }
}

export interface MockServer {
    receiveMessage: (message: Uint8Array, client: MockNetClient) => void;
    handleOpen: (client: MockNetClient) => void;
    handleClose: (client: MockNetClient) => void;
}

export class MockServerImpl implements MockServer {
    receiveMessage (message: Uint8Array, client: MockNetClient) {
        // Handle message from client
    }

    handleOpen (client: MockNetClient) {
        // Handle new client connection
    }

    handleClose (client: MockNetClient) {
        // Handle client disconnection
    }
}

export class MockNetClient implements INetClient {
    private receiveHandlers: ((message: Uint8Array) => void)[] = []
    private errorHandlers: ((error: Error) => void)[] = [];
    private openHandlers: (() => void)[] = [];
    private closeHandlers: (() => void)[] = [];
    private connected: boolean = false;
    private mockServer: MockServer;

    constructor (mockServer: MockServer) {
        this.mockServer = mockServer;
    }

    sendReliable(message: Uint8Array): void {
        return this.send(message);
    }

    connect () {
        this.connected = true;
        this.mockServer.handleOpen(this);
        for (const handler of this.openHandlers) {
            handler();
        }
    }

    get isConnected (): boolean {
        return this.connected;
    }

    send (message: Uint8Array) {
        this.mockServer.receiveMessage(message, this);
    }

    receiveMessage (message: Uint8Array) {
        for (const handler of this.receiveHandlers) {
            handler(message);
        }
    }

    onReceive (handler: (message: Uint8Array) => void) {
        this.receiveHandlers.push(handler);
    }

    onError (handler: (error: Error) => void) {
        this.errorHandlers.push(handler);
    }

    onOpen (handler: () => void) {
        this.openHandlers.push(handler);
    }

    onClose (handler: () => void) {
        this.closeHandlers.push(handler);
    }

    close () {
        this.connected = false;
        this.mockServer.handleClose(this);
        for (const handler of this.closeHandlers) {
            handler();
        }
    }
}