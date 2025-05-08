<script lang="ts">
  import { browser } from '$app/environment';
  import TodoList from '$lib/components/TodoList.svelte';
  import { initSocket } from '$lib/socketClient';
  import { onMount } from 'svelte';

  // Initialize Socket.IO client when the component mounts (client-side only)
  onMount(() => {
    if (browser) {
      initSocket();
    }
  });
</script>

<svelte:head>
  <title>Svelte Todo App with Socket.IO</title>
</svelte:head>

<div class="container mx-auto px-4">
  <div class="max-w-2xl mx-auto">
    <header class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Realtime Todo App</h1>
      <p class="text-gray-600">Built with Svelte 5, SvelteKit and Socket.IO</p>
    </header>
    
    <TodoList />
    
    <footer class="mt-12 text-center text-sm text-gray-500">
      <p>Changes are synchronized in real-time across all connected clients.</p>
    </footer>
  </div>
</div>
