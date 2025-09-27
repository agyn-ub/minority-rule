export enum GameState {
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE'
}

export enum RoundPhase {
  VOTING = 'VOTING',
  RESULTS = 'RESULTS',
  PROCESSING = 'PROCESSING'
}

export interface Player {
  address: string;
  joinedAt: number;
  isActive: boolean;
  eliminatedRound?: number;
  votingHistory: boolean[];
}

export interface RoundResult {
  round: number;
  votes: { [address: string]: boolean };
  minorityChoice: boolean;
  eliminatedPlayers: string[];
  timestamp: number;
}

export interface Game {
  gameId: string;
  entryFee: string;
  state: GameState;
  currentRound: number;
  players: { [address: string]: Player };
  prizePool: string;
  roundHistory: RoundResult[];
  votingDeadline?: number;
  questionText: string;
  creator: string;
  winner?: string;
}

export interface PlayerStats {
  address: string;
  gamesPlayed: number;
  gamesWon: number;
  totalStaked: string;
  totalWinnings: string;
  roundsSurvived: number;
  votingHistory: VoteRecord[];
}

export interface VoteRecord {
  gameId: string;
  round: number;
  actualVote: boolean;
  wasMinority: boolean;
  playersEliminated: number;
}