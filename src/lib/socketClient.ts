import io from 'socket.io-client';
import { browser } from '$app/environment';
// Use Socket type from the default import
import type { Socket } from 'socket.io-client';

// Socket.IO client singleton
let socket: typeof Socket;

// Initialize the socket connection
export function initSocket(): typeof Socket {
	if (!browser) {
		throw new Error('Socket.IO client should only be initialized in the browser');
	}

	if (!socket) {
		const socketUrl = 'http://localhost:3001'; // Should match the server port
		socket = io(socketUrl);

		socket.on('connect', () => {
			console.log('Connected to Socket.IO server');
			socket?.emit('getAllTodos');
		});

		socket.on('disconnect', () => {
			console.log('Disconnected from Socket.IO server');
		});
	}

	return socket;
}

// Get the socket instance (initializes if not already done)
export function getSocket(): typeof Socket {
	if (!browser) {
		throw new Error('Socket.IO client can only be used in the browser');
	}

	if (!socket) {
		return initSocket();
	}

	return socket;
}

// Helper functions for todo operations
export function addTodo(text: string) {
	getSocket().emit('addTodo', { text, completed: false });
}

export function updateTodo(todo: { id: string; text: string; completed: boolean }) {
	getSocket().emit('updateTodo', todo);
}

export function deleteTodo(id: string) {
	getSocket().emit('deleteTodo', id);
}

export function getAllTodos() {
	getSocket().emit('getAllTodos');
}
