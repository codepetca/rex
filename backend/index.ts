import {Hono} from "hono";
import {nanoid} from "nanoid";
import type {
  GameState,
  Player,
  Move,
  GameCreateRequest,
  GameCreateResponse,
  GameJoinRequest,
  GameJoinResponse,
} from "../shared/types";

// In-memory game storage (MVP)
const games = new Map<string, GameState>();

function createEmptyBoard(): (Player | null)[] {
  return Array(9).fill(null);
}

function checkWinner(board: (Player | null)[]): Player | null {
  const lines: [number, number, number][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw(board: (Player | null)[]): boolean {
  return board.every((cell) => cell !== null);
}

const app = new Hono();

app.use("*", async (c, next) => {
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  c.res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (c.req.method === "OPTIONS") return c.text("ok");
  await next();
});

// Create game
app.post("/api/game/create", async (c) => {
  const body = await c.req.json<GameCreateRequest>();
  const gameId = nanoid(8);
  const player: Player = "X";
  const game: GameState = {
    id: gameId,
    board: createEmptyBoard(),
    currentPlayer: "X",
    winner: null,
    isDraw: false,
    players: [body.playerName, ""],
  };
  games.set(gameId, game);
  const res: GameCreateResponse = {gameId, player};
  return c.json(res);
});

// Join game
app.post("/api/game/join", async (c) => {
  const body = await c.req.json<GameJoinRequest>();
  const game = games.get(body.gameId);
  if (!game) return c.json({error: "Game not found"}, 404);
  if (game.players[1]) return c.json({error: "Game full"}, 400);
  game.players[1] = body.playerName;
  const res: GameJoinResponse = {gameId: game.id, player: "O"};
  return c.json(res);
});

// Get game state
app.get("/api/game/:id", (c) => {
  const id = c.req.param("id");
  const game = games.get(id);
  if (!game) return c.json({error: "Game not found"}, 404);
  return c.json(game);
});

// Make move
app.post("/api/game/move", async (c) => {
  const body = await c.req.json<Move>();
  const game = games.get(body.gameId);
  if (!game) return c.json({error: "Game not found"}, 404);
  if (game.winner || game.isDraw) return c.json({error: "Game over"}, 400);
  const playerIdx = body.player === "X" ? 0 : 1;
  if (game.players[playerIdx] === "")
    return c.json({error: "Player not joined"}, 400);
  if (game.currentPlayer !== body.player)
    return c.json({error: "Not your turn"}, 400);
  if (body.index < 0 || body.index > 8 || game.board[body.index])
    return c.json({error: "Invalid move"}, 400);
  game.board[body.index] = body.player;
  const winner = checkWinner(game.board);
  if (winner) {
    game.winner = winner;
  } else if (isDraw(game.board)) {
    game.isDraw = true;
  } else {
    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
  }
  return c.json(game);
});

// Health check
app.get("/", (c) => c.text("Tic Tac Toe API running"));

export default app;

if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 3001,
  });
  console.log("Bun Hono Tic Tac Toe API listening on http://localhost:3001");
}
