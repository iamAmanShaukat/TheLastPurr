/**
 * Core Interfaces for The Last Purr Game Engine
 * These interfaces define the contract for all game components
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================
// CARD INTERFACES
// ============================================

export interface ICard {
  id: string;
  type: string;
  metadata: Record<string, any>;
}

export interface ICardDefinition {
  type: string;
  name: string;
  description: string;
  defaultMetadata?: Record<string, any>;
}

// ============================================
// PLAYER INTERFACES
// ============================================

export interface IPlayer {
  id: string;
  name: string;
  socketId: string;
  hand: ICard[];
  status: PlayerStatus;
  isDisconnected: boolean;
  lastActiveAt: number;
  metadata?: Record<string, any>;
}

export type PlayerStatus = 
  | 'WAITING'
  | 'PLAYING'
  | 'ELIMINATED'
  | 'DISCONNECTED'
  | 'WINNER';

// ============================================
// DECK INTERFACES
// ============================================

export interface IDeck {
  cards: ICard[];
  discardPile: ICard[];
  
  shuffle(): void;
  draw(count?: number): ICard[];
  addToDiscard(cards: ICard[]): void;
  insertCard(card: ICard, index: number): void;
  remainingCount(): number;
}

// ============================================
// GAME STATE INTERFACES
// ============================================

export type GamePhase = 
  | 'LOBBY'
  | 'DEALING'
  | 'MAIN_PHASE'
  | 'DRAW_PHASE'
  | 'END_PHASE'
  | 'RESOLVING_STACK'
  | 'DEFUSE_PENDING'
  | 'GAME_OVER';

export interface IGameState {
  roomId: string;
  phase: GamePhase;
  players: IPlayer[];
  currentPlayerId: string | null;
  deck: IDeck;
  actionStack: IAction[];
  gameLog: IGameLogEntry[];
  winnerId: string | null;
  createdAt: number;
  lastUpdatedAt: number;
  metadata?: Record<string, any>; // For game-specific temporary state (e.g., defuse tracking)
}

export interface IGameLogEntry {
  timestamp: number;
  playerId: string | null;
  action: string;
  details: Record<string, any>;
}

// ============================================
// ACTION INTERFACES (The Stack)
// ============================================

export interface IAction {
  id: string;
  playerId: string;
  type: ActionType;
  cardId?: string;
  targetPlayerId?: string;
  targetIndex?: number;
  metadata: Record<string, any>;
  respondedTo?: string;
  createdAt: number;
}

export type ActionType = 
  | 'PLAY_CARD'
  | 'NOPE'
  | 'DEFUSE_PLACE_KITTEN'
  | 'FAVOR_REQUEST'
  | 'CAT_COMBO'
  | 'PASS'
  | 'DRAW';

// ============================================
// ROOM/SOCKET INTERFACES
// ============================================

export interface IRoom {
  id: string;
  gameState: IGameState | null;
  players: Map<string, IPlayer>;
  maxPlayers: number;
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  createdAt: number;
}

export interface ISocketMessage {
  actionId: string; // For idempotency
  type: string;
  payload: any;
}

// ============================================
// RULE SET INTERFACE (Strategy Pattern)
// ============================================

export interface IRuleSet {
  gameName: string;
  
  // Lifecycle
  setupGame(gameState: IGameState, playerCount: number): IGameState;
  checkWinCondition(gameState: IGameState): IGameState;
  
  // Turn Management
  startTurn(gameState: IGameState): IGameState;
  endTurn(gameState: IGameState): IGameState;
  getNextPlayerId(gameState: IGameState, currentId: string): string | null;
  
  // Action Validation
  canPlayCard(gameState: IGameState, playerId: string, card: ICard): boolean;
  canRespondOutOfTurn(gameState: IGameState, playerId: string, actionType: ActionType): boolean;
  validateAction(gameState: IGameState, action: IAction): boolean;
  
  // Action Resolution
  resolveAction(gameState: IGameState, action: IAction): IGameState;
  
  // State Sanitization
  sanitizeStateForPlayer(gameState: IGameState, playerId: string): IGameState;
}

// ============================================
// GAME ENGINE INTERFACE
// ============================================

export interface IGameEngine {
  ruleSet: IRuleSet;
  
  createRoom(roomId: string, maxPlayers: number): IRoom;
  joinRoom(room: IRoom, player: IPlayer): IRoom;
  leaveRoom(room: IRoom, playerId: string): IRoom;
  
  processAction(room: IRoom, action: IAction): IRoom;
  handleDisconnect(room: IRoom, playerId: string): IRoom;
  handleReconnect(room: IRoom, playerId: string, socketId: string): IRoom;
  
  getSanitizedState(room: IRoom, playerId: string): IGameState | null;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface IActionResponse {
  success: boolean;
  error?: string;
  state?: IGameState;
}

export function createCard(type: string, metadata: Record<string, any> = {}): ICard {
  return {
    id: uuidv4(),
    type,
    metadata
  };
}

export function createPlayer(id: string, name: string, socketId: string): IPlayer {
  return {
    id,
    name,
    socketId,
    hand: [],
    status: 'WAITING',
    isDisconnected: false,
    lastActiveAt: Date.now()
  };
}
