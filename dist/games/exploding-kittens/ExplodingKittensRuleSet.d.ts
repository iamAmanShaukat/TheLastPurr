/**
 * Exploding Kittens RuleSet Implementation for "The Last Purr"
 * Implements all game-specific rules and mechanics
 */
import { IGameState, IAction } from '../../core/interfaces';
import { BaseRuleSet } from '../../engine/BaseRuleSet';
export declare const EK_CARD_TYPES: {
    readonly EXPLODING_KITTEN: 'exploding_kitten';
    readonly DEFUSE: 'defuse';
    readonly ATTACK: 'attack';
    readonly SKIP: 'skip';
    readonly SEE_FUTURE: 'see_future';
    readonly SHUFFLE: 'shuffle';
    readonly FAVOR: 'favor';
    readonly NOPE: 'nope';
    readonly BEARD_CAT: 'beard_cat';
    readonly HACKER_CAT: 'hacker_cat';
    readonly POTATO_CAT: 'potato_cat';
    readonly RAINBOW_RALPH_CAT: 'rainbow_ralph_cat';
    readonly CATERMELON_CAT: 'catermelon_cat';
};
export declare class ExplodingKittensRuleSet extends BaseRuleSet {
    gameName: string;
    /**
     * Setup the game with Exploding Kittens rules
     */
    setupGame(gameState: IGameState, playerCount: number): IGameState;
    /**
     * Create the deck with appropriate cards for player count
     */
    private createDeck;
    /**
     * Deal initial cards to players
     * Each player gets 4 random cards + 1 Defuse
     */
    private dealCards;
    /**
     * Check win condition - last player standing wins
     */
    checkWinCondition(gameState: IGameState): IGameState;
    /**
     * Start a player's turn
     */
    startTurn(gameState: IGameState): IGameState;
    /**
     * End a player's turn
     * Player must draw a card unless they played an Attack or Skip
     */
    endTurn(gameState: IGameState): IGameState;
    /**
     * Pass turn to next player
     */
    private passTurn;
    /**
     * Override to handle Exploding Kittens specific actions
     */
    protected resolveCustomAction(gameState: IGameState, action: IAction): IGameState;
    /**
     * Resolve placing the Exploding Kitten back in the deck after defusing
     */
    private resolveDefusePlacement;
    /**
     * Resolve a Favor action - take a card from another player
     */
    private resolveFavor;
    /**
     * Resolve a Cat Combo - trade cards with another player
     */
    private resolveCatCombo;
    /**
     * Override validation for Exploding Kittens specific rules
     */
    validateAction(gameState: IGameState, action: IAction): boolean;
    /**
     * Reshuffle deck when empty
     */
    private reshuffleDeck;
    /**
     * Enhanced sanitization for Exploding Kittens
     * Hides deck placement choices and other sensitive info
     */
    sanitizeStateForPlayer(gameState: IGameState, playerId: string): IGameState;
}
//# sourceMappingURL=ExplodingKittensRuleSet.d.ts.map