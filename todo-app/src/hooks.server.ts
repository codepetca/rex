import { building } from '$app/environment';
import { setupSocketIO } from '$lib/server/socket';
import type { Handle } from '@sveltejs/kit';

// Initialize Socket.IO when the server starts (not during build)
if (!building) {
	const http = await import('node:http');
	const httpServer = http.createServer();
	const port = Number(process.env.SOCKET_PORT) || 3001;

	// Setup the Socket.IO server
	setupSocketIO(httpServer);

	// Start listening
	httpServer.listen(port, () => {
		console.log(`Socket.IO server running on port ${port}`);
	});
}

// SvelteKit request handler
export const handle: Handle = async ({ event, resolve }) => {
	return await resolve(event);
};
