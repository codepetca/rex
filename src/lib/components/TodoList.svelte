<script lang="ts">
  import { onMount } from 'svelte';
  import { getSocket, addTodo, updateTodo, deleteTodo } from '$lib/socketClient';
  import type { Todo } from '$lib/types';

  // Use Svelte 5 reactive state
  let todos = $state<Todo[]>([]);
  let newTodoText = $state('');
  let isConnected = $state(false);

  onMount(() => {
    const socket = getSocket();
    isConnected = socket.connected;
    
    socket.on('connect', () => {
      isConnected = true;
    });
    
    socket.on('disconnect', () => {
      isConnected = false;
    });
    
    // Listen for real-time todo updates with proper typing
    socket.on('initialTodos', (initialTodos: Todo[]) => {
      todos = initialTodos;
    });
    
    socket.on('todoAdded', (todo: Todo) => {
      todos = [...todos, todo];
    });
    
    socket.on('todoUpdated', (updatedTodo: Todo) => {
      todos = todos.map(todo => 
        todo.id === updatedTodo.id ? updatedTodo : todo
      );
    });
    
    socket.on('todoDeleted', (id: string) => {
      todos = todos.filter(todo => todo.id !== id);
    });
    
    // Clean up listeners on component unmount
    return () => {
      socket.off('initialTodos');
      socket.off('todoAdded');
      socket.off('todoUpdated');
      socket.off('todoDeleted');
    };
  });
  
  // Handle form submission to add a new todo
  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!newTodoText.trim()) return;
    
    addTodo(newTodoText.trim());
    newTodoText = '';
  }
  
  // Toggle todo completion status
  function toggleComplete(todo: Todo) {
    updateTodo({
      ...todo,
      completed: !todo.completed
    });
  }
  
  // Delete a todo
  function handleDelete(id: string) {
    deleteTodo(id);
  }
  
  // Derived values using Svelte 5 syntax
  const completedCount = $derived(todos.filter(t => t.completed).length);
  const totalCount = $derived(todos.length);
</script>

<div class="max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg">
  <div class="mb-4">
    <h1 class="text-2xl font-bold text-center mb-6">Todo List</h1>
    
    <!-- Connection status indicator -->
    <div class="text-sm text-right mb-4">
      {#if isConnected}
        <span class="text-green-500 flex items-center justify-end">
          <span class="block h-3 w-3 rounded-full bg-green-500 mr-2"></span>
          Connected
        </span>
      {:else}
        <span class="text-red-500 flex items-center justify-end">
          <span class="block h-3 w-3 rounded-full bg-red-500 mr-2"></span>
          Disconnected
        </span>
      {/if}
    </div>
    
    <!-- New todo form -->
    <form onsubmit={handleSubmit} class="flex mb-4">
      <input
        type="text"
        bind:value={newTodoText}
        placeholder="Add a new task..."
        class="flex-grow px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition"
      >
        Add
      </button>
    </form>
  </div>
  
  <!-- Todo list -->
  <ul class="space-y-2">
    {#if todos.length === 0}
      <li class="text-center text-gray-500 py-4">No todos yet. Add one above!</li>
    {/if}
    
    {#each todos as todo (todo.id)}
      <li class="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition">
        <div class="flex items-center">
          <input
            type="checkbox"
            checked={todo.completed}
            id={`todo-${todo.id}`}
            onchange={() => toggleComplete(todo)}
            class="h-5 w-5 text-blue-500 rounded focus:ring-blue-500 mr-3 cursor-pointer"
          />
          <label
            for={`todo-${todo.id}`}
            class={`cursor-pointer ${todo.completed ? 'line-through text-gray-500' : ''}`}
          >
            {todo.text}
          </label>
        </div>
        
        <button
          onclick={() => handleDelete(todo.id)}
          class="text-red-500 hover:text-red-700 focus:outline-none"
          aria-label="Delete todo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </li>
    {/each}
  </ul>
  
  <!-- Stats footer -->
  {#if totalCount > 0}
    <div class="mt-4 text-sm text-gray-600">
      {completedCount} of {totalCount} tasks completed
    </div>
  {/if}
</div>