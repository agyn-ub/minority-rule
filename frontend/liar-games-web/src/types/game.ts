export enum GameState {
  CREATED = 'created',
  ACTIVE = 'active',
  VOTING_OPEN = 'votingOpen',
  PROCESSING_ROUND = 'processingRound',
  COMPLETE = 'complete'
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
  minorityChoice?: boolean;
  eliminatedPlayers: string[];
  survivingPlayers: string[];
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
  votingDeadline?: string;
  questionText: string;
  creator: string;
  winner?: string;
  roundDuration: string;
  votingStatus?: { [address: string]: boolean }; // Who has voted (not the actual votes)
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