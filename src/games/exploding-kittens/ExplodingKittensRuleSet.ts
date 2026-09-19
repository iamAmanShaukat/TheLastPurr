/**
 * Exploding Kittens RuleSet Implementation for "The Last Purr"
 * Implements all game-specific rules and mechanics
 */

import { 
  IGameState, 
  IAction, 
  ICard,
  ActionType,
  PlayerStatus,
  GamePhase
} from '../../core/interfaces';
import { Deck } from '../../core/deck';
import { BaseRuleSet } from '../../engine/BaseRuleSet';

// Card types specific to Exploding Kittens
export const EK_CARD_TYPES = {
  EXPLODING_KITTEN: 'exploding_kitten',
  DEFUSE: 'defuse',
  ATTACK: 'attack',
  SKIP: 'skip',
  SEE_FUTURE: 'see_future',
  SHUFFLE: 'shuffle',
  FAVOR: 'favor',
  NOPE: 'nope',
  // Cat cards
  BEARD_CAT: 'beard_cat',
  HACKER_CAT: 'hacker_cat',
  POTATO_CAT: 'potato_cat',
  RAINBOW_RALPH_CAT: 'rainbow_ralph_cat',
  CATERMELON_CAT: 'catermelon_cat'
} as const;

export class ExplodingKittensRuleSet extends BaseRuleSet {
  public gameName = 'Exploding Kittens';

  /**
   * Setup the game with Exploding Kittens rules
   */
  setupGame(gameState: IGameState, playerCount: number): IGameState {
    const deck = new Deck();
    
    // Create the deck based on player count
    this.createDeck(deck, playerCount);
    
    // Deal initial cards to players
    this.dealCards(gameState, deck);
    
    // Set initial state
    gameState.deck = deck;
    gameState.phase = 'MAIN_PHASE';
    
    // Determine first player (random or youngest)
    const firstPlayerId = gameState.players[0].id;
    gameState.currentPlayerId = firstPlayerId;
    
    // Start first turn
    gameState = this.startTurn(gameState);
    
    // Log game start
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: null,
      action: 'GAME_START',
      details: { playerCount }
    });

    return gameState;
  }

  /**
   * Create the deck with appropriate cards for player count
   */
  private createDeck(deck: Deck, playerCount: number): void {
    const cards: ICard[] = [];
    
    // Add Exploding Kittens (one fewer than players)
    for (let i = 0; i < playerCount - 1; i++) {
      cards.push({
        id: `ek_${i}`,
        type: EK_CARD_TYPES.EXPLODING_KITTEN,
        metadata: {}
      });
    }
    
    // Add Defuses (one per player, plus extras)
    const defuseCount = playerCount + 2;
    for (let i = 0; i < defuseCount; i++) {
      cards.push({
        id: `def_${i}`,
        type: EK_CARD_TYPES.DEFUSE,
        metadata: {}
      });
    }
    
    // Add Attack cards (4 in base game)
    for (let i = 0; i < 4; i++) {
      cards.push({
        id: `atk_${i}`,
        type: EK_CARD_TYPES.ATTACK,
        metadata: {}
      });
    }
    
    // Add Skip cards (4 in base game)
    for (let i = 0; i < 4; i++) {
      cards.push({
        id: `skp_${i}`,
        type: EK_CARD_TYPES.SKIP,
        metadata: {}
      });
    }
    
    // Add See the Future cards (5 in base game)
    for (let i = 0; i < 5; i++) {
      cards.push({
        id: `sf_${i}`,
        type: EK_CARD_TYPES.SEE_FUTURE,
        metadata: {}
      });
    }
    
    // Add Shuffle cards (4 in base game)
    for (let i = 0; i < 4; i++) {
      cards.push({
        id: `shf_${i}`,
        type: EK_CARD_TYPES.SHUFFLE,
        metadata: {}
      });
    }
    
    // Add Favor cards (4 in base game)
    for (let i = 0; i < 4; i++) {
      cards.push({
        id: `fav_${i}`,
        type: EK_CARD_TYPES.FAVOR,
        metadata: {}
      });
    }
    
    // Add Nope cards (5 in base game)
    for (let i = 0; i < 5; i++) {
      cards.push({
        id: `nope_${i}`,
        type: EK_CARD_TYPES.NOPE,
        metadata: {}
      });
    }
    
    // Add Cat cards (6 of each type in base game)
    const catTypes = [
      EK_CARD_TYPES.BEARD_CAT,
      EK_CARD_TYPES.HACKER_CAT,
      EK_CARD_TYPES.POTATO_CAT,
      EK_CARD_TYPES.RAINBOW_RALPH_CAT,
      EK_CARD_TYPES.CATERMELON_CAT
    ];
    
    catTypes.forEach(catType => {
      for (let i = 0; i < 6; i++) {
        cards.push({
          id: `${catType}_${i}`,
          type: catType,
          metadata: {}
        });
      }
    });
    
    // Add cards to deck and shuffle
    deck.cards = cards;
    deck.shuffle();
  }

  /**
   * Deal initial cards to players
   * Each player gets 4 random cards + 1 Defuse
   */
  private dealCards(gameState: IGameState, deck: Deck): void {
    gameState.players.forEach(player => {
      // Give each player a Defuse
      const defuseCard = deck.cards.find(c => c.type === EK_CARD_TYPES.DEFUSE);
      if (defuseCard) {
        const index = deck.cards.indexOf(defuseCard);
        deck.cards.splice(index, 1);
        player.hand.push(defuseCard);
      }
      
      // Deal 4 random cards
      const randomCards = deck.draw(4);
      player.hand.push(...randomCards);
    });
  }

  /**
   * Check win condition - last player standing wins
   */
  checkWinCondition(gameState: IGameState): IGameState {
    const activePlayers = gameState.players.filter(
      p => p.status === 'PLAYING' && !p.isDisconnected
    );
    
    if (activePlayers.length === 1) {
      // We have a winner!
      gameState.winnerId = activePlayers[0].id;
      gameState.phase = 'GAME_OVER';
      
      // Update player statuses
      gameState.players.forEach(p => {
        if (p.id === gameState.winnerId) {
          p.status = 'WINNER';
        } else if (p.status !== 'ELIMINATED') {
          p.status = 'PLAYING'; // Lost but not exploded
        }
      });
      
      gameState.gameLog.push({
        timestamp: Date.now(),
        playerId: gameState.winnerId,
        action: 'GAME_WIN',
        details: {}
      });
    }
    
    return gameState;
  }

  /**
   * Start a player's turn
   */
  startTurn(gameState: IGameState): IGameState {
    if (!gameState.currentPlayerId) {
      return gameState;
    }
    
    const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!player) {
      return gameState;
    }
    
    gameState.phase = 'MAIN_PHASE';
    gameState.lastUpdatedAt = Date.now();
    
    // Check if player has pending attacks (multiple turns)
    const attackCount = player.metadata?.attackCount || 0;
    if (attackCount > 0) {
      if (!player.metadata) player.metadata = {};
      player.metadata.attackCount = attackCount - 1;
      gameState.gameLog.push({
        timestamp: Date.now(),
        playerId: player.id,
        action: 'ATTACK_TURN',
        details: { remainingAttacks: player.metadata.attackCount }
      });
    }
    
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: player.id,
      action: 'TURN_START',
      details: { phase: gameState.phase }
    });
    
    return gameState;
  }

  /**
   * End a player's turn
   * Player must draw a card unless they played an Attack or Skip
   */
  endTurn(gameState: IGameState): IGameState {
    if (!gameState.currentPlayerId) {
      return gameState;
    }
    
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer) {
      return gameState;
    }
    
    // Check if turn ended with Attack or Skip (no draw needed)
    const skipDraw = currentPlayer.metadata?.skipDraw;
    if (skipDraw) {
      if (currentPlayer.metadata) {
        delete currentPlayer.metadata.skipDraw;
      }
      gameState = this.passTurn(gameState);
      return gameState;
    }
    
    // Must draw a card
    gameState.phase = 'DRAW_PHASE';
    
    const deck = gameState.deck as Deck;
    
    // Check if deck is empty
    if (deck.isEmpty()) {
      this.reshuffleDeck(deck);
    }
    
    // Draw one card
    const drawnCards = deck.draw(1);
    if (drawnCards.length > 0) {
      const drawnCard = drawnCards[0];
      
      // Check if it's an Exploding Kitten
      if (drawnCard.type === EK_CARD_TYPES.EXPLODING_KITTEN) {
        // Try to defuse
        const hasDefuse = currentPlayer.hand.some(c => c.type === EK_CARD_TYPES.DEFUSE);
        
        if (hasDefuse) {
          // Player can defuse - enter DEFUSE_PENDING phase
          // Store the exploding kitten info in game state metadata
          gameState.phase = 'DEFUSE_PENDING';
          if (!gameState.metadata) {
            gameState.metadata = {};
          }
          gameState.metadata.explodingKittenCard = drawnCard;
          
          gameState.gameLog.push({
            timestamp: Date.now(),
            playerId: currentPlayer.id,
            action: 'EXPLODING_KITTEN_DRAWN',
            details: { hasDefuse: true }
          });
          // Don't pass turn yet - wait for defuse action
          return gameState;
        } else {
          // Player explodes!
          currentPlayer.status = 'ELIMINATED';
          
          // Put the exploding kitten in discard
          deck.addToDiscard([drawnCard]);
          
          gameState.gameLog.push({
            timestamp: Date.now(),
            playerId: currentPlayer.id,
            action: 'PLAYER_EXPLODED',
            details: {}
          });
        }
      } else {
        // Safe card - add to hand
        currentPlayer.hand.push(drawnCard);
        
        gameState.gameLog.push({
          timestamp: Date.now(),
          playerId: currentPlayer.id,
          action: 'CARD_DRAWN',
          details: { cardType: drawnCard.type }
        });
      }
    }
    
    // Pass turn to next player
    gameState = this.passTurn(gameState);
    
    return gameState;
  }

  /**
   * Pass turn to next player
   */
  private passTurn(gameState: IGameState): IGameState {
    const nextPlayerId = this.getNextPlayerId(gameState, gameState.currentPlayerId!);
    
    if (nextPlayerId) {
      gameState.currentPlayerId = nextPlayerId;
      gameState = this.startTurn(gameState);
    }
    
    return gameState;
  }

  /**
   * Override to handle Exploding Kittens specific actions
   */
  protected resolveCustomAction(gameState: IGameState, action: IAction): IGameState {
    switch (action.type) {
      case 'DEFUSE_PLACE_KITTEN':
        return this.resolveDefusePlacement(gameState, action);
      
      case 'FAVOR_REQUEST':
        return this.resolveFavor(gameState, action);
      
      case 'CAT_COMBO':
        return this.resolveCatCombo(gameState, action);
      
      default:
        return super.resolveCustomAction(gameState, action);
    }
  }

  /**
   * Resolve placing the Exploding Kitten back in the deck after defusing
   */
  private resolveDefusePlacement(gameState: IGameState, action: IAction): IGameState {
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player || action.targetIndex === undefined) {
      return gameState;
    }
    
    const deck = gameState.deck as Deck;
    
    // Find and remove the defuse card from player's hand
    const defuseIndex = player.hand.findIndex(c => c.type === EK_CARD_TYPES.DEFUSE);
    if (defuseIndex === -1) {
      return gameState;
    }
    
    const [defuseCard] = player.hand.splice(defuseIndex, 1);
    deck.addToDiscard([defuseCard]);
    
    // Get the exploding kitten card from metadata
    const kittenCard = gameState.metadata?.explodingKittenCard as ICard | undefined;
    if (!kittenCard) {
      // Fallback: create a new kitten card if metadata is missing
      const fallbackKitten: ICard = {
        id: `ek_defused_${Date.now()}`,
        type: EK_CARD_TYPES.EXPLODING_KITTEN,
        metadata: { defusedBy: player.id }
      };
      deck.insertCard(fallbackKitten, action.targetIndex);
    } else {
      // Insert the actual kitten card at the specified index
      deck.insertCard(kittenCard, action.targetIndex);
    }
    
    // Clear the metadata
    if (gameState.metadata) {
      delete gameState.metadata.explodingKittenCard;
    }
    
    // Return to main phase and pass turn
    gameState.phase = 'MAIN_PHASE';
    
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: player.id,
      action: 'KITTEN_PLACED',
      details: { index: action.targetIndex }
    });
    
    // Pass turn to next player
    gameState = this.passTurn(gameState);
    
    return gameState;
  }

  /**
   * Resolve a Favor action - take a card from another player
   */
  private resolveFavor(gameState: IGameState, action: IAction): IGameState {
    const actor = gameState.players.find(p => p.id === action.playerId);
    const target = gameState.players.find(p => p.id === action.targetPlayerId);
    
    if (!actor || !target || !action.cardId) {
      return gameState;
    }
    
    // Find the card in target's hand
    const cardIndex = target.hand.findIndex(c => c.id === action.cardId);
    if (cardIndex === -1) {
      return gameState;
    }
    
    // Transfer card
    const [card] = target.hand.splice(cardIndex, 1);
    actor.hand.push(card);
    
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: actor.id,
      action: 'FAVOR_EXECUTED',
      details: { targetId: target.id, cardType: card.type }
    });
    
    return gameState;
  }

  /**
   * Resolve a Cat Combo - trade cards with another player
   */
  private resolveCatCombo(gameState: IGameState, action: IAction): IGameState {
    const actor = gameState.players.find(p => p.id === action.playerId);
    const target = gameState.players.find(p => p.id === action.targetPlayerId);
    
    if (!actor || !target) {
      return gameState;
    }
    
    // Implementation depends on specific cat combo rules
    // This is a simplified version
    
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: actor.id,
      action: 'CAT_COMBO',
      details: { targetId: target.id }
    });
    
    return gameState;
  }

  /**
   * Override validation for Exploding Kittens specific rules
   */
  validateAction(gameState: IGameState, action: IAction): boolean {
    // Call parent validation first
    if (!super.validateAction(gameState, action)) {
      return false;
    }
    
    // Additional EK-specific validation
    switch (action.type) {
      case 'DEFUSE_PLACE_KITTEN':
        if (action.targetIndex === undefined) return false;
        const deck = gameState.deck as Deck;
        return action.targetIndex >= 0 && action.targetIndex <= deck.cards.length;
      
      case 'FAVOR_REQUEST':
      case 'CAT_COMBO':
        if (!action.targetPlayerId) return false;
        const target = gameState.players.find(p => p.id === action.targetPlayerId);
        return target !== undefined && target.status === 'PLAYING';
      
      default:
        return true;
    }
  }

  /**
   * Override to allow Defuse cards out of turn during DEFUSE_PENDING phase
   */
  canRespondOutOfTurn(
    gameState: IGameState, 
    playerId: string, 
    actionType: ActionType
  ): boolean {
    // Allow Nope anytime (from parent)
    if (actionType === 'NOPE') {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player || player.status !== 'PLAYING' || player.isDisconnected) {
        return false;
      }
      return true;
    }
    
    // Allow Defuse during DEFUSE_PENDING phase
    if (gameState.phase === 'DEFUSE_PENDING' && gameState.currentPlayerId === playerId) {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player || player.status !== 'PLAYING' || player.isDisconnected) {
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Reshuffle deck when empty
   */
  private reshuffleDeck(deck: Deck): void {
    // Keep Exploding Kittens out of reshuffle (they stay in discard)
    deck.reshuffleFromDiscard([EK_CARD_TYPES.EXPLODING_KITTEN]);
    
    console.log('Deck reshuffled');
  }

  /**
   * Enhanced sanitization for Exploding Kittens
   * Hides deck placement choices and other sensitive info
   */
  sanitizeStateForPlayer(gameState: IGameState, playerId: string): IGameState {
    const sanitized = JSON.parse(JSON.stringify(gameState)) as IGameState;
    
    // Hide other players' hands
    sanitized.players = sanitized.players.map((p: any) => {
      if (p.id === playerId) {
        return p; // Full info for current player
      }
      
      // During defuse phase, still hide hands
      return {
        id: p.id,
        name: p.name,
        hand: Array(p.hand.length).fill({ type: 'hidden' }),
        isBot: p.isBot,
        status: p.status,
        isDisconnected: p.isDisconnected
      };
    });
    
    // During defuse phase, only the defusing player sees the deck order
    if (gameState.phase === 'DEFUSE_PENDING') {
      if (gameState.currentPlayerId !== playerId) {
        // Hide deck details from non-defusing players
        (sanitized.deck as any).cards = Array((sanitized.deck as Deck).cards.length).fill({ type: 'hidden' });
      }
    } else {
      // In normal phases, no one sees the deck order (only count)
      (sanitized.deck as any).cards = Array((sanitized.deck as Deck).cards.length).fill({ type: 'hidden' });
    }
    
    // Hide peeked cards of other players
    sanitized.players.forEach((p: any) => {
      if (p.id !== playerId) {
        p.peekedCards = [];
      }
    });
    
    return sanitized;
  }
}
