import 'dotenv/config';
import { createServer, ServerSession, WebTransportServer } from '@webtransport-bun/webtransport';
import { GameId } from '@common/util';

const certPath = process.env.CERT_PATH,
    keyPath = process.env.KEY_PATH;

export interface IMessagingServerIdentity {
    id: string | number,
}

export interface IMessagingServer {
    sendMessage (identity: IMessagingServerIdentity, message: Uint8Array): void;
    sendMessageReliably (identity: IMessagingServerIdentity, message: Uint8Array): void;
    listen (listener: IMessagingServerListener): number;
    removeListener (listenerId: number): void;
}

export interface IMessagingServerListener {
    onConnect? (identity: IMessagingServerIdentity): void;
    onDisconnect? (identity: IMessagingServerIdentity): void;
    onMessage? (identity: IMessagingServerIdentity, message: Uint8Array, reliable: boolean): void;
}

class WtServer implements IMessagingServer {
    private idToSessionMap: Map<GameId, ServerSession> = new Map();
    private server: WebTransportServer;
    private listeners: IMessagingServerListener[] = [];

    private constructor (server: WebTransportServer) {
        this.server = server;
    }

    public static async create () {
        const server = createServer({
            port: 8308,
            tls: {
                certPem: await Bun.file(certPath!).text(),
                keyPem: await Bun.file(keyPath!).text(),
            },
            onSession: (session) => {
                wtServer.receiveSession(session);
                wtServer.receiveSessionBidirectional(session);
            }
        });
        const wtServer = new WtServer(server);
        return wtServer;
    }

    private async receiveSession (session: ServerSession) {
        this.idToSessionMap.set(session.id, session);
        this.listeners.forEach(listener => listener.onConnect?.({ id: session.id }));
        session.closed.then((info) => {
            this.closeSession(session);
        }).catch((error) => {
            console.error(`Error in session ${session.id}:`, error);
        });
        for await (const datagram of session.incomingDatagrams()) {
            this.listeners.forEach(listener => listener.onMessage?.({ id: session.id }, datagram, false));
        }
    }

    private async receiveSessionBidirectional (session: ServerSession) {
        this.idToSessionMap.set(session.id, session);
        this.listeners.forEach(listener => listener.onConnect?.({ id: session.id }));
        session.closed.then((info) => {
            this.closeSession(session);
        }).catch((error) => {
            console.error(`Error in session ${session.id}:`, error);
        });

        // Only read one bidirectional stream for now
        const stream = (await session.incomingBidirectionalStreams.getReader().read()).value;
        if (!stream) {
            console.warn(`No bidirectional stream received for session ${session.id}`);
            return;
        }
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream.readable) {
            chunks.push(chunk);
        }
        const message = new Uint8Array(chunks.map(chunk => Array.from(chunk)).flat());
        this.listeners.forEach(listener => listener.onMessage?.({ id: session.id }, message, true));
    }

    private closeSession (session: ServerSession) {
        this.idToSessionMap.delete(session.id);
        this.listeners.forEach(listener => listener.onDisconnect?.({ id: session.id }));
    }

    public listen (listener: IMessagingServerListener): number {
        this.listeners.push(listener);
        return this.listeners.length - 1;
    }

    public sendMessage (identity: IMessagingServerIdentity, message: Uint8Array): void {
        const session = this.idToSessionMap.get(identity.id);
        if (session) {
            session.sendDatagram(message);
        } else {
            console.warn(`No session found for identity ${identity.id}`);
        }
    }

    public async sendMessageReliably (identity: IMessagingServerIdentity, message: Uint8Array): Promise<void> {
        const session = this.idToSessionMap.get(identity.id);
        if (!session) {
            console.warn(`No session found for identity ${identity.id}`);
            return;
        }
        const stream = await session.createBidirectionalStream();
        stream.write(message);
        stream.end();
    }

    public removeListener (listenerId: number): void {
        if (listenerId >= 0 && listenerId < this.listeners.length) {
            this.listeners.splice(listenerId, 1);
        }
    }

}

export async function createHttpsServer () {
    if (!certPath || !keyPath) {
        throw new Error('CERT_PATH and KEY_PATH environment variables must be set');
    }
    const httpsServer = Bun.serve({
        port: 8308,
        tls: {
            cert: await Bun.file(certPath).text(),
            key: await Bun.file(keyPath).text(),
        },
        routes: {
            '/': Bun.file('index.html'),
            '/index.html': Bun.file('index.html'),
            '/index.js': Bun.file('index.js'),
            // TODO serve static assets like images, sounds, etc.
        },
        fetch: async (request) => {
            return new Response('Hello, World!');
        }
    });
    return httpsServer;
}

export async function createMessagingServer (): Promise<IMessagingServer> {
    const wtServer = await WtServer.create();
    return wtServer;
}