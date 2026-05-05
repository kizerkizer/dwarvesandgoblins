export interface INetClient {
    send (message: Uint8Array): void;
    sendReliable (message: Uint8Array): void;
    onReceive: (handler: (message: Uint8Array) => void) => void;
    onError: (handler: (error: Error) => void) => void;
    onOpen: (handler: () => void) => void;
    onClose: (handler: () => void) => void;
    connect: () => void;
    close: () => void;
    isConnected: boolean;
}

class WebSocketNetClient implements INetClient {
    private url: string;
    private socket: WebSocket | null = null;

    constructor (url: string) {
        this.url = url;
    }

    connect () {
        this.socket = new WebSocket(this.url);
        this.socket.binaryType = 'arraybuffer';
    }

    public get isConnected (): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    send (message: Uint8Array) {
        if (this.socket !== null) {
            //this.socket.send(message.buffer);
        }
    }

    sendReliable (message: Uint8Array) {
        if (this.socket !== null) {
            //this.socket.send(message.buffer);
        }
    }

    onReceive (handler: (message: Uint8Array) => void) {
        /*this.socket.addEventListener('message', event => {
            handler(new Uint8Array(event.data));
        });*/
    }

    onError (handler: (error: Error) => void) {
        /*this.socket.addEventListener('error', event => {
            handler(new Error('WebSocket error'));
        });*/
    }

    onOpen (handler: () => void) {
        //this.socket.addEventListener('open', handler);
    }

    onClose (handler: () => void) {
        //this.socket.addEventListener('close', handler);
    }

    close () {
        //this.socket.close();
    }
}

class WebTransportNetClient implements INetClient {
    private transport: WebTransport | null = null;
    private url: string;
    private isReady: boolean = false;
    private reader: ReadableStreamDefaultReader<any> | null = null;
    private writer: WritableStreamDefaultWriter<any> | null = null;
    private duplex: TransformStream<Uint8Array, Uint8Array> | null = null;
    private receiveHandlers: ((message: Uint8Array) => void)[] = [];
    private errorHandlers: ((error: Error) => void)[] = [];
    private openHandlers: (() => void)[] = [];
    private closeHandlers: (() => void)[] = [];

    constructor (url: string) {
        this.url = url;
    }

    connect () {
        this.transport = new WebTransport(this.url);
        this.monitorDatagrams();
        this.createAndMonitorDuplex();
    }

    public get isConnected (): boolean {
        return this.isReady;
    }

    private async createAndMonitorDuplex () {
        if (this.transport === null) {
            return;
        }
        try {
            await this.transport.ready;
            this.duplex = await this.transport.createBidirectionalStream();
            const reader = this.duplex.readable.getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                const chunk = value as Uint8Array;
                for (const handler of this.receiveHandlers) {
                    handler(chunk);
                }
            }
        } catch (error) {
            for (const handler of this.errorHandlers) {
                handler(error as Error);
            }
        }
    }

    private async monitorDatagrams () {
        if (this.transport === null) {
            return;
        }
        try {
            await this.transport.ready;
            this.isReady = true;
            this.reader = this.transport.datagrams.readable.getReader();
            this.writer = this.transport.datagrams.writable.getWriter();
            this.readLoop();
        } catch (error) {
            for (const handler of this.errorHandlers) {
                handler(error as Error);
            }
            this.isReady = false;
        }
    }

    private async readLoop () {
        try {
            while (true) {
                const { value, done } = await this.reader!.read();
                if (done) {
                    break;
                }
                for (const handler of this.receiveHandlers) {
                    handler(value);
                }
            }
        } catch (error) {
            for (const handler of this.errorHandlers) {
                handler(error as Error);
            }
        }
    }

    send (message: Uint8Array) {
        if (this.writer === null) {
            throw new Error('WebTransport is not ready');
        }
        this.writer.write(message);
    }

    sendReliable (message: Uint8Array) {
        if (this.duplex === null) {
            throw new Error('WebTransport is not ready');
        }
        this.duplex.writable.getWriter().write(message);
    }

    onReceive (handler: (message: Uint8Array) => void) {
        this.receiveHandlers.push(handler);
    }

    onError (handler: (error: Error) => void) {
        this.errorHandlers.push(handler);
        this.transport!.closed.catch(handler);
    }

    onOpen (handler: () => void) {
        this.openHandlers.push(handler);
        this.transport!.ready.then(handler);
    }

    onClose (handler: () => void) {
        this.closeHandlers.push(handler);
        this.transport!.closed.then(handler);
    }

    close () {
        this.transport!.close();
    }
}

export function createNetClient (url: string): INetClient {
    return new WebTransportNetClient(url);
}