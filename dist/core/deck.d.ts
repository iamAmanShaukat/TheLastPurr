/**
 * Deck Implementation
 * Handles all deck operations: shuffle, draw, discard, insert
 */
import { IDeck, ICard } from '../core/interfaces';
export declare class Deck implements IDeck {
    cards: ICard[];
    discardPile: ICard[];
    constructor(initialCards?: ICard[]);
    /**
     * Fisher-Yates shuffle algorithm
     */
    shuffle(): void;
    /**
     * Draw cards from the top of the deck
     * @param count - Number of cards to draw (default: 1)
     * @returns Array of drawn cards
     */
    draw(count?: number): ICard[];
    /**
     * Add cards to the discard pile
     * @param cards - Cards to discard
     */
    addToDiscard(cards: ICard[]): void;
    /**
     * Insert a card at a specific index in the deck
     * Used for Defuse placement and similar mechanics
     * @param card - Card to insert
     * @param index - Position to insert (0 = top of deck)
     */
    insertCard(card: ICard, index: number): void;
    /**
     * Get the number of remaining cards in the deck
     */
    remainingCount(): number;
    /**
     * Check if deck is empty
     */
    isEmpty(): boolean;
    /**
     * Reshuffle discard pile into deck (excluding special cards if needed)
     * @param excludeTypes - Card types to exclude from reshuffle
     */
    reshuffleFromDiscard(excludeTypes?: string[]): void;
    /**
     * Get a copy of the deck for serialization
     */
    toJSON(): {
        cards: ICard[];
        discardPile: ICard[];
    };
    /**
     * Create a Deck from JSON
     */
    static fromJSON(json: {
        cards: ICard[];
        discardPile: ICard[];
    }): Deck;
}
//# sourceMappingURL=deck.d.ts.map