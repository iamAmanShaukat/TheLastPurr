/**
 * Base Game Engine Implementation
 * Handles room management, action processing, and state synchronization
 */
import { IGameEngine, IRoom, IPlayer, IAction, IGameState, IRuleSet } from '../core/interfaces';
export declare class GameEngine implements IGameEngine {
    ruleSet: IRuleSet;
    private processedActions;
    private roomLocks;
    constructor(ruleSet: IRuleSet);
    /**
     * Create a new game room
     */
    createRoom(roomId: string, maxPlayers: number): IRoom;
    /**
     * Add a player to a room
     */
    joinRoom(room: IRoom, player: IPlayer): IRoom;
    /**
     * Remove a player from a room
     */
    leaveRoom(room: IRoom, playerId: string): IRoom;
    /**
     * Process an action with locking and idempotency checks
     */
    processAction(room: IRoom, action: IAction): IRoom;
    /**
     * Validate an action before execution
     */
    private validateAction;
    /**
     * Execute an action and update game state
     */
    private executeAction;
    /**
     * Handle player disconnect
     */
    handleDisconnect(room: IRoom, playerId: string): IRoom;
    /**
     * Handle player reconnect
     */
    handleReconnect(room: IRoom, playerId: string, socketId: string): IRoom;
    /**
     * Get sanitized game state for a specific player
     * This ensures players only see information they're allowed to see
     */
    getSanitizedState(room: IRoom, playerId: string): IGameState | null;
    /**
     * Deep clone game state
     */
    private cloneGameState;
    /**
     * Start the game (transition from LOBBY to PLAYING)
     */
    startGame(room: IRoom): IRoom;
}
//# sourceMappingURL=GameEngine.d.ts.map