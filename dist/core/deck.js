"use strict";
/**
 * Deck Implementation
 * Handles all deck operations: shuffle, draw, discard, insert
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
class Deck {
    constructor(initialCards = []) {
        this.cards = initialCards;
        this.discardPile = [];
    }
    /**
     * Fisher-Yates shuffle algorithm
     */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    /**
     * Draw cards from the top of the deck
     * @param count - Number of cards to draw (default: 1)
     * @returns Array of drawn cards
     */
    draw(count = 1) {
        const drawn = [];
        const actualCount = Math.min(count, this.cards.length);
        for (let i = 0; i < actualCount; i++) {
            const card = this.cards.shift();
            if (card) {
                drawn.push(card);
            }
        }
        return drawn;
    }
    /**
     * Add cards to the discard pile
     * @param cards - Cards to discard
     */
    addToDiscard(cards) {
        this.discardPile.push(...cards);
    }
    /**
     * Insert a card at a specific index in the deck
     * Used for Defuse placement and similar mechanics
     * @param card - Card to insert
     * @param index - Position to insert (0 = top of deck)
     */
    insertCard(card, index) {
        const validIndex = Math.max(0, Math.min(index, this.cards.length));
        this.cards.splice(validIndex, 0, card);
    }
    /**
     * Get the number of remaining cards in the deck
     */
    remainingCount() {
        return this.cards.length;
    }
    /**
     * Check if deck is empty
     */
    isEmpty() {
        return this.cards.length === 0;
    }
    /**
     * Reshuffle discard pile into deck (excluding special cards if needed)
     * @param excludeTypes - Card types to exclude from reshuffle
     */
    reshuffleFromDiscard(excludeTypes = []) {
        const cardsToShuffle = this.discardPile.filter(card => !excludeTypes.includes(card.type));
        // Keep excluded cards in discard pile
        this.discardPile = this.discardPile.filter(card => excludeTypes.includes(card.type));
        this.cards.push(...cardsToShuffle);
        this.shuffle();
    }
    /**
     * Get a copy of the deck for serialization
     */
    toJSON() {
        return {
            cards: this.cards,
            discardPile: this.discardPile
        };
    }
    /**
     * Create a Deck from JSON
     */
    static fromJSON(json) {
        const deck = new Deck(json.cards);
        deck.discardPile = json.discardPile || [];
        return deck;
    }
}
exports.Deck = Deck;
//# sourceMappingURL=deck.js.map