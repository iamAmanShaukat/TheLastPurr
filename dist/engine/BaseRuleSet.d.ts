/**
 * Base RuleSet Implementation
 * Provides default implementations that can be overridden by specific games
 */
import { IRuleSet, IGameState, IAction, ICard, ActionType } from '../core/interfaces';
export declare abstract class BaseRuleSet implements IRuleSet {
    abstract gameName: string;
    /**
     * Setup the game state for a new game
     * Must be implemented by each game
     */
    abstract setupGame(gameState: IGameState, playerCount: number): IGameState;
    /**
     * Check if the game has ended and determine winner
     * Must be implemented by each game
     */
    abstract checkWinCondition(gameState: IGameState): IGameState;
    /**
     * Start a player's turn
     * Must be implemented by each game
     */
    abstract startTurn(gameState: IGameState): IGameState;
    /**
     * End a player's turn
     * Must be implemented by each game
     */
    abstract endTurn(gameState: IGameState): IGameState;
    /**
     * Get the next player in turn order
     * Handles skipping eliminated/disconnected players
     */
    getNextPlayerId(gameState: IGameState, currentId: string): string | null;
    /**
     * Check if a player can play a card
     * Default implementation - override for game-specific rules
     */
    canPlayCard(gameState: IGameState, playerId: string, card: ICard): boolean;
    /**
     * Check if a player can respond out of turn (e.g., with a Nope)
     * Default: only NOPE actions can be done out of turn
     */
    canRespondOutOfTurn(gameState: IGameState, playerId: string, actionType: ActionType): boolean;
    /**
     * Validate an action
     * Default implementation - override for game-specific rules
     */
    validateAction(gameState: IGameState, action: IAction): boolean;
    /**
     * Resolve an action
     * Default implementation handles common actions
     * Override for game-specific logic
     */
    resolveAction(gameState: IGameState, action: IAction): IGameState;
    /**
     * Resolve playing a card
     */
    protected resolvePlayCard(gameState: IGameState, action: IAction): IGameState;
    /**
     * Resolve a Nope action
     */
    protected resolveNope(gameState: IGameState, action: IAction): IGameState;
    /**
     * Resolve a draw action
     */
    protected resolveDraw(gameState: IGameState, action: IAction): IGameState;
    /**
     * Resolve custom/game-specific actions
     * Override in subclasses for game-specific logic
     */
    protected resolveCustomAction(gameState: IGameState, action: IAction): IGameState;
    /**
     * Sanitize game state for a specific player
     * Hides other players' hands and sensitive information
     */
    sanitizeStateForPlayer(gameState: IGameState, playerId: string): IGameState;
}
//# sourceMappingURL=BaseRuleSet.d.ts.map