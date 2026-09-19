/**
 * Core Interfaces for The Last Purr Game Engine
 * These interfaces define the contract for all game components
 */
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
export type PlayerStatus = 'WAITING' | 'PLAYING' | 'ELIMINATED' | 'DISCONNECTED' | 'WINNER';
export interface IDeck {
    cards: ICard[];
    discardPile: ICard[];
    shuffle(): void;
    draw(count?: number): ICard[];
    addToDiscard(cards: ICard[]): void;
    insertCard(card: ICard, index: number): void;
    remainingCount(): number;
}
export type GamePhase = 'LOBBY' | 'DEALING' | 'MAIN_PHASE' | 'DRAW_PHASE' | 'END_PHASE' | 'RESOLVING_STACK' | 'DEFUSE_PENDING' | 'GAME_OVER';
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
}
export interface IGameLogEntry {
    timestamp: number;
    playerId: string | null;
    action: string;
    details: Record<string, any>;
}
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
export type ActionType = 'PLAY_CARD' | 'NOPE' | 'DEFUSE_PLACE_KITTEN' | 'FAVOR_REQUEST' | 'CAT_COMBO' | 'PASS' | 'DRAW';
export interface IRoom {
    id: string;
    gameState: IGameState | null;
    players: Map<string, IPlayer>;
    maxPlayers: number;
    status: 'LOBBY' | 'PLAYING' | 'FINISHED';
    createdAt: number;
}
export interface ISocketMessage {
    actionId: string;
    type: string;
    payload: any;
}
export interface IRuleSet {
    gameName: string;
    setupGame(gameState: IGameState, playerCount: number): IGameState;
    checkWinCondition(gameState: IGameState): IGameState;
    startTurn(gameState: IGameState): IGameState;
    endTurn(gameState: IGameState): IGameState;
    getNextPlayerId(gameState: IGameState, currentId: string): string | null;
    canPlayCard(gameState: IGameState, playerId: string, card: ICard): boolean;
    canRespondOutOfTurn(gameState: IGameState, playerId: string, actionType: ActionType): boolean;
    validateAction(gameState: IGameState, action: IAction): boolean;
    resolveAction(gameState: IGameState, action: IAction): IGameState;
    sanitizeStateForPlayer(gameState: IGameState, playerId: string): IGameState;
}
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
export interface IActionResponse {
    success: boolean;
    error?: string;
    state?: IGameState;
}
export declare function createCard(type: string, metadata?: Record<string, any>): ICard;
export declare function createPlayer(id: string, name: string, socketId: string): IPlayer;
//# sourceMappingURL=interfaces.d.ts.map