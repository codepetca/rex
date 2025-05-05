// Shared types for Tic Tac Toe

export type Player = "X" | "O";

export interface GameState {
  board: (Player | null)[];
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  players: [string, string]; // player IDs or names
  id: string; // game ID
}

export interface Move {
  gameId: string;
  player: Player;
  index: number; // 0-8 for 3x3 board
}

export interface GameCreateRequest {
  playerName: string;
}

export interface GameCreateResponse {
  gameId: string;
  player: Player;
}

export interface GameJoinRequest {
  gameId: string;
  playerName: string;
}

export interface GameJoinResponse {
  gameId: string;
  player: Player;
}
