import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket as IOSocket } from 'socket.io';
import type { Todo } from '$lib/types';

// Define the type for our socket events
export interface ServerToClientEvents {
	todoAdded: (todo: Todo) => void;
	todoUpdated: (todo: Todo) => void;
	todoDeleted: (id: string) => void;
	initialTodos: (todos: Todo[]) => void;
}

export interface ClientToServerEvents {
	addTodo: (todo: Omit<Todo, 'id'>) => void;
	updateTodo: (todo: Todo) => void;
	deleteTodo: (id: string) => void;
	getAllTodos: () => void;
}

// In-memory storage for todos
let todos: Todo[] = [
	{ id: '1', text: 'Learn Svelte 5', completed: false },
	{ id: '2', text: 'Build a todo app', completed: false },
	{ id: '3', text: 'Add Socket.IO', completed: true }
];

export function setupSocketIO(server: HTTPServer) {
	const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		}
	});

	io.on('connection', (socket: IOSocket<ClientToServerEvents, ServerToClientEvents>) => {
		console.log('Client connected:', socket.id);

		// Send all todos when a client connects or requests them
		socket.on('getAllTodos', () => {
			socket.emit('initialTodos', todos);
		});

		// Add a new todo
		socket.on('addTodo', (todoData) => {
			const todo: Todo = {
				...todoData,
				id: Date.now().toString()
			};

			todos = [...todos, todo];
			io.emit('todoAdded', todo);
		});

		// Update an existing todo
		socket.on('updateTodo', (todo) => {
			todos = todos.map((t) => (t.id === todo.id ? todo : t));
			io.emit('todoUpdated', todo);
		});

		// Delete a todo
		socket.on('deleteTodo', (id) => {
			todos = todos.filter((t) => t.id !== id);
			io.emit('todoDeleted', id);
		});

		// Handle disconnection
		socket.on('disconnect', () => {
			console.log('Client disconnected:', socket.id);
		});
	});

	return io;
}
