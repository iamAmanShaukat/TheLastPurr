export interface ICard {
  id: string;
  type: string;
  metadata: Record<string, any>;
}

export interface IPlayer {
  id: string;
  name: string;
  hand: ICard[];
  isAlive: boolean;
  isDisconnected: boolean;
  peekedCards?: ICard[];
}

export interface IGameState {
  status: 'WAITING' | 'PLAYING' | 'GAME_OVER';
  currentPlayerId: string | null;
  phase: 'MAIN' | 'DRAW' | 'STACK_RESPONSE' | 'DEFUSE_PENDING';
  deckCount: number;
  discardPile: ICard[];
  players: IPlayer[];
  actionStack: IStackItem[];
  metadata: Record<string, any>;
  winnerId?: string;
}

export interface IStackItem {
  playerId: string;
  action: string;
  card?: ICard;
  targetId?: string;
  targetIndex?: number;
  timestamp: number;
}

export interface IRoomState {
  roomId: string;
  gameState: IGameState;
  myPlayerId: string;
}