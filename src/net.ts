export interface INetClient {
    send (message: Uint8Array): void;
    onReceive: (handler: (message: Uint8Array) => void) => void;
    onError: (handler: (error: Error) => void) => void;
    onOpen: (handler: () => void) => void;
    onClose: (handler: () => void) => void;
    connect: () => void;
    close: () => void;
    isConnected: boolean;
}

export class WebSocketNetClient implements INetClient {
    private url: string;
    private socket: WebSocket;

    constructor (url: string) {
        this.url = url;
    }

    connect () {
        this.socket = new WebSocket(this.url);
        this.socket.binaryType = 'arraybuffer';
    }

    public get isConnected (): boolean {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    send (message: Uint8Array) {
        this.socket.send(message);
    }

    onReceive (handler: (message: Uint8Array) => void) {
        this.socket.addEventListener('message', event => {
            handler(new Uint8Array(event.data));
        });
    }

    onError (handler: (error: Error) => void) {
        this.socket.addEventListener('error', event => {
            handler(new Error('WebSocket error'));
        });
    }

    onOpen (handler: () => void) {
        this.socket.addEventListener('open', handler);
    }

    onClose (handler: () => void) {
        this.socket.addEventListener('close', handler);
    }

    close () {
        this.socket.close();
    }
}

class WebTransportNetClient implements INetClient {
    private transport: WebTransport;
    private url: string;
    private isReady: boolean = false;
    private reader: ReadableStreamDefaultReader<any>;
    private writer: WritableStreamDefaultWriter<any>;
    private receiveHandlers: ((message: Uint8Array) => void)[] = [];
    private errorHandlers: ((error: Error) => void)[] = [];
    private openHandlers: (() => void)[] = [];
    private closeHandlers: (() => void)[] = [];

    constructor (url: string) {
        this.url = url;
    }

    connect () {
        this.transport = new WebTransport(this.url);
        this.monitorTransport();
    }

    public get isConnected (): boolean {
        return this.isReady;
    }

    private async monitorTransport () {
        try {
            await this.transport.ready;
            this.isReady = true;
            this.reader = this.transport.datagrams.readable.getReader();
            this.writer = this.transport.datagrams.writable.getWriter();
            this.readLoop();
        } catch (error) {
            for (const handler of this.errorHandlers) {
                handler(error);
            }
            this.isReady = false;
        }
        /*this.transport.closed.catch(error => {
            for (const handler of this.errorHandlers) {
                handler(error);
            }
            this.isReady = false;
        });*/
    }

    private async readLoop () {
        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                    break;
                }
                for (const handler of this.receiveHandlers) {
                    handler(value);
                }
            }
        } catch (error) {
            for (const handler of this.errorHandlers) {
                handler(error);
            }
        }
    }

    send (message: Uint8Array) {
        this.writer.write(message);
    }

    onReceive (handler: (message: Uint8Array) => void) {
        this.receiveHandlers.push(handler);
    }

    onError (handler: (error: Error) => void) {
        this.errorHandlers.push(handler);
        this.transport.closed.catch(handler);
    }

    onOpen (handler: () => void) {
        this.openHandlers.push(handler);
        this.transport.ready.then(handler);
    }

    onClose (handler: () => void) {
        this.closeHandlers.push(handler);
        this.transport.closed.then(handler);
    }

    close () {
        this.transport.close();
    }
}

interface MockServer {
    receiveMessage: (message: Uint8Array, client: MockNetClient) => void;
    handleOpen: (client: MockNetClient) => void;
    handleClose: (client: MockNetClient) => void;
}

class MockServerImpl implements MockServer {
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

class MockNetClient implements INetClient {
    private receiveHandlers: ((message: Uint8Array) => void)[] = []
    private errorHandlers: ((error: Error) => void)[] = [];
    private openHandlers: (() => void)[] = [];
    private closeHandlers: (() => void)[] = [];
    private connected: boolean = false;
    private mockServer: MockServer;

    constructor (mockServer: MockServer) {
        this.mockServer = mockServer;
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
