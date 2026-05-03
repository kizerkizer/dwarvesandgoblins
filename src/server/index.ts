import { createHttpsServer, createGameServer } from './net/server';

async function main () {
    const httpsServer = await createHttpsServer();
    const gameServer = await createGameServer();
    console.log('Servers are running');
}

main().catch((error) => {
    console.error('Error in main:', error);
    process.exit(1);
});