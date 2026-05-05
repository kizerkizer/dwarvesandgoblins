import { QueuedMessagingServer } from './net/QueuedMessagingServer';
import { createHttpsServer, createMessagingServer } from './net/server';
import { Game } from './simulation/game';
import { LoopDriver } from "@server/loop";

async function main () {
    const httpsServer = await createHttpsServer();
    const messagingServer = await createMessagingServer();
    const queuedMessagingServer = new QueuedMessagingServer(messagingServer);
    const game = new Game(queuedMessagingServer);
    const loopDriver = new LoopDriver(game);
    loopDriver.start();
    console.log('Game running');
}

main().catch((error) => {
    console.error('Error in main:', error);
    process.exit(1);
});