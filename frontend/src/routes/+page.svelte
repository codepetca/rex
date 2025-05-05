<script lang="ts">
import type { GameState, Player, Move, GameCreateRequest, GameJoinRequest } from '../../../shared/types';
import { onMount } from 'svelte';

let playerName = $state('');
let joinGameId = $state('');
let gameId = $state('');
let player: Player | null = $state(null);
let game: GameState | null = $state(null);
let error = $state('');
let loading = $state(false);

async function createGame() {
  error = '';
  loading = true;
  try {
    const res = await fetch('http://localhost:3001/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName } as GameCreateRequest)
    });
    if (!res.ok) throw new Error('Failed to create game');
    const data = await res.json();
    gameId = data.gameId;
    player = data.player;
    await fetchGame();
  } catch (e) {
    error = (e as Error).message;
  } finally {
    loading = false;
  }
}

async function joinGame() {
  error = '';
  loading = true;
  try {
    const res = await fetch('http://localhost:3001/api/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: joinGameId, playerName } as GameJoinRequest)
    });
    if (!res.ok) throw new Error('Failed to join game');
    const data = await res.json();
    gameId = data.gameId;
    player = data.player;
    await fetchGame();
  } catch (e) {
    error = (e as Error).message;
  } finally {
    loading = false;
  }
}

async function fetchGame() {
  if (!gameId) return;
  const res = await fetch(`http://localhost:3001/api/game/${gameId}`);
  if (res.ok) {
    game = await res.json();
  }
}

async function makeMove(idx: number) {
  if (!game || !player) return;
  if (game.board[idx] || game.winner || game.isDraw) return;
  loading = true;
  try {
    const res = await fetch('http://localhost:3001/api/game/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, player, index: idx } as Move)
    });
    if (!res.ok) {
      const err = await res.json();
      error = err.error || 'Invalid move';
    } else {
      game = await res.json();
    }
  } finally {
    loading = false;
  }
}

// Poll for game updates every 1s (MVP, replace with WebSocket for realtime)
$effect(() => {
  let interval: any;
  if (gameId) {
    fetchGame();
    interval = setInterval(fetchGame, 1000);
  }
  return () => clearInterval(interval);
});
</script>

<style>
.board {
  display: grid;
  grid-template-columns: repeat(3, 3rem);
  grid-gap: 0.5rem;
  margin: 1rem 0;
}
.cell {
  width: 3rem;
  height: 3rem;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 0.25rem;
  cursor: pointer;
}
.cell[disabled] {
  cursor: not-allowed;
  color: #aaa;
}
</style>

<h1>Tic Tac Toe</h1>

{#if !gameId}
  <div>
    <input placeholder="Your name" bind:value={playerName} />
    <button onclick={createGame} disabled={loading || !playerName}>Create Game</button>
  </div>
  <div style="margin:1rem 0;">or</div>
  <div>
    <input placeholder="Game ID" bind:value={joinGameId} />
    <input placeholder="Your name" bind:value={playerName} />
    <button onclick={joinGame} disabled={loading || !playerName || !joinGameId}>Join Game</button>
  </div>
  {#if error}
    <div style="color:red">{error}</div>
  {/if}
{:else}
  {#if game}
    <div>Game ID: <b>{game.id}</b></div>
    <div>Players: <b>{game.players[0]}</b> vs <b>{game.players[1] || '(waiting...)'}</b></div>
    <div>Current turn: <b>{game.currentPlayer}</b></div>
    <div class="board">
      {#each game.board as cell, idx}
        <button class="cell" disabled={!!cell || !!game.winner || !!game.isDraw || game.currentPlayer !== player} onclick={() => makeMove(idx)}>{cell}</button>
      {/each}
    </div>
    {#if game.winner}
      <div style="color:green">Winner: {game.winner}</div>
    {:else if game.isDraw}
      <div style="color:orange">Draw!</div>
    {/if}
    <button onclick={() => { gameId = ''; player = null; game = null; error = ''; }}>Leave Game</button>
    {#if error}
      <div style="color:red">{error}</div>
    {/if}
  {:else}
    <div>Loading game...</div>
  {/if}
{/if}
