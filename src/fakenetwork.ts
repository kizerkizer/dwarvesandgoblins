import { RNG, SeededRNG } from './rng';

export interface INetworkProfile {
    nextClientToServerDelay: () => number; // -1 indicates drop packet
    nextServerToClientDelay: () => number; // -1 indicates drop packet
}

abstract class NetworkProfile implements INetworkProfile {
    constructor (protected rng: RNG) {}
    nextClientToServerDelay: () => number;
    nextServerToClientDelay: () => number;
}

export class MediocreNetworkProfile extends NetworkProfile {
    private countToNextSpike: number = 0;
    private readonly base: number = 85;
    private readonly packetDropRate: number = 0.05;

    constructor (rng: RNG) {
        super(rng);
        this.countToNextSpike = rng.nextInt(65, 85);
        const delay = () => {
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
        this.nextClientToServerDelay = delay;
        this.nextServerToClientDelay = delay;
    }
}

export class PoorNetworkProfile extends NetworkProfile {
    private countToNextSpike: number = 0;
    private readonly base: number = 85;
    private readonly packetDropRate: number = 0.15;

    constructor (rng: RNG) {
        super(rng);
        this.countToNextSpike = rng.nextInt(25, 45);
        const delay = () => {
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
        this.nextClientToServerDelay = delay;
        this.nextServerToClientDelay = delay;
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