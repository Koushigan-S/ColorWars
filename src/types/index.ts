export type OnlineStatus = 'online' | 'offline' | 'in-game';

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  rating: number; // For future ranked use
  createdRoomsCount: number;
  joinedRoomsCount: number;
  lastMatchDate: string | null;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  dateJoined: string;
  lastSeen: string;
  status: OnlineStatus;
  stats: UserStats;
}

export type PlayerColor = 'red' | 'blue';

export type GameStatus = 'waiting' | 'playing' | 'ended' | 'abandoned';

export interface BoardCell {
  color: PlayerColor | null;
  count: number;
}

// 5x5 Board state representation (flattened 1D array of length 25)
export type BoardState = BoardCell[];

export interface PlayerPresence {
  connected: boolean;
  lastDisconnectTime: string | null; // ISO string
}

export interface Room {
  id: string; // 6-character unique code
  hostId: string;
  hostName: string;
  hostPhoto: string;
  hostColor: PlayerColor;
  guestId: string | null;
  guestName: string | null;
  guestPhoto: string | null;
  boardState: BoardState;
  currentTurn: string; // UID of the player whose turn it is
  gameStatus: GameStatus;
  winnerId: string | null; // UID, 'draw', or null
  createdTime: string; // ISO string
  playersConnected: { [uid: string]: boolean };
  lastDisconnectTime: { [uid: string]: string | null }; // UID -> ISO string
  lastMoveTime: string; // ISO string for turn timeout
  moveCount: number; // For game-over threshold checking
  lastMove: LastMove | null;
}

export interface LastMove {
  row: number;
  col: number;
  playerColor: PlayerColor;
}

export interface GameMove {
  playerUid: string;
  color: PlayerColor;
  type: 'clone' | 'jump';
  from: { r: number; c: number } | null; // null for initial setup
  to: { r: number; c: number };
  timestamp: string;
}

export interface MatchHistory {
  id: string;
  roomId: string;
  players: {
    red: { uid: string; displayName: string; photoURL: string };
    blue: { uid: string; displayName: string; photoURL: string };
  };
  winnerId: string; // UID or 'draw'
  loserId: string;  // UID or 'draw'
  scores: {
    red: number;
    blue: number;
  };
  moves: GameMove[];
  duration: number; // in seconds
  date: string; // ISO string
}
