export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export type GamePhase = 'menu' | 'playing' | 'gameover';

export interface Player {
  hand: Card[];
  captured: Card[];
  score: number;
  pistiCount: number;
}

export interface GameState {
  deck: Card[];
  pile: Card[];
  player: Player;
  bot: Player;
  currentTurn: 'player' | 'bot';
  phase: GamePhase;
  difficulty: Difficulty;
  lastCapturer: 'player' | 'bot' | null;
  message: string;
  roundNumber: number;
}
