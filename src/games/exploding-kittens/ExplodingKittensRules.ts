import { BaseRuleSet } from '../../engine/BaseRuleSet';
import { 
  IGameState, 
  IAction, 
  ICard,
  ActionType,
  Deck,
} from '../../core/interfaces';

/**
 * Exploding Kittens Rule Set Implementation
 */
export class ExplodingKittensRuleSet extends BaseRuleSet {
  public gameName = 'exploding_kittens';

  private static readonly CARD_TYPES = {
    EXPLODING_KITTEN: 'exploding_kitten',
    DEFUSE: 'defuse',
    ATTACK: 'attack',
    SKIP: 'skip',
    SEE_FUTURE: 'see_future',
    SHUFFLE: 'shuffle',
    FAVOR: 'favor',
    NOPE: 'nope',
  };

  setupGame(gameState: IGameState, playerCount: number): IGameState {
    // Create and shuffle deck
    const deck = new Deck();
    deck.cards = this.createDeck(playerCount);
    deck.shuffle();

    gameState.deck = deck;
    gameState.phase = 'DEALING';

    // Deal initial hands (4 cards each)
    gameState.players.forEach(player => {
      const hand = deck.draw(4);
      player.hand = hand;
      player.status = 'PLAYING';
    });

    // Set first player
    gameState.currentPlayerId = gameState.players[0]?.id || null;
    gameState.phase = 'MAIN_PHASE';

    return gameState;
  }

  startTurn(gameState: IGameState): IGameState {
    gameState.phase = 'MAIN_PHASE';
    return gameState;
  }

  endTurn(gameState: IGameState): IGameState {
    if (!gameState.currentPlayerId) {
      return gameState;
    }

    const nextId = this.getNextPlayerId(gameState, gameState.currentPlayerId);
    
    if (nextId) {
      gameState.currentPlayerId = nextId;
      gameState.phase = 'MAIN_PHASE';
    } else {
      gameState.phase = 'GAME_OVER';
    }

    return gameState;
  }

  checkWinCondition(gameState: IGameState): IGameState {
    const activePlayers = gameState.players.filter(
      p => p.status === 'PLAYING' && !p.isDisconnected
    );

    if (activePlayers.length === 1) {
      gameState.winnerId = activePlayers[0].id;
      gameState.phase = 'GAME_OVER';
    }

    return gameState;
  }

  canPlayCard(gameState: IGameState, playerId: string, card: ICard): boolean {
    if (gameState.currentPlayerId !== playerId) {
      return false;
    }

    if (gameState.phase !== 'MAIN_PHASE') {
      return false;
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.hand.some(c => c.id === card.id)) {
      return false;
    }

    return true;
  }

  resolveAction(gameState: IGameState, action: IAction): IGameState {
    let newState = { ...gameState };

    switch (action.type) {
      case 'PLAY_CARD':
        newState = super.resolvePlayCard(newState, action);
        newState = this.handleCardEffect(newState, action);
        break;

      case 'NOPE':
        newState = super.resolveNope(newState, action);
        break;

      case 'DRAW':
        newState = this.resolveDraw(newState, action);
        break;

      case 'PASS':
        newState = this.endTurn(newState);
        break;

      default:
        newState = this.resolveCustomAction(newState, action);
    }

    newState = this.checkWinCondition(newState);
    return newState;
  }

  private handleCardEffect(gameState: IGameState, action: IAction): IGameState {
    // Handle specific card effects based on card type
    // This is simplified - full implementation would handle each card type
    return gameState;
  }

  private resolveDraw(gameState: IGameState, action: IAction): IGameState {
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      return gameState;
    }

    const deck = gameState.deck as Deck;
    
    // Check if deck needs reshuffling
    if (deck.remainingCount() === 0) {
      this.reshuffleDeck(gameState);
    }

    const drawnCards = deck.draw(1);
    player.hand.push(...drawnCards);

    // Check for exploding kitten
    if (drawnCards[0]?.type === ExplodingKittensRuleSet.CARD_TYPES.EXPLODING_KITTEN) {
      return this.handleExplodingKitten(gameState, player, drawnCards[0]);
    }

    // Move to end phase
    gameState.phase = 'END_PHASE';

    return gameState;
  }

  private handleExplodingKitten(gameState: IGameState, player: any, kittenCard: ICard): IGameState {
    // Check for defuse
    const defuseIndex = player.hand.findIndex(
      (c: ICard) => c.type === ExplodingKittensRuleSet.CARD_TYPES.DEFUSE
    );

    if (defuseIndex !== -1) {
      // Player has defuse - remove it and place kitten back in deck
      player.hand.splice(defuseIndex, 1);
      gameState.phase = 'DEFUSE_PENDING';
      // Player will choose where to place kitten
    } else {
      // Player explodes
      player.status = 'ELIMINATED';
      gameState = this.checkWinCondition(gameState);
    }

    return gameState;
  }

  private reshuffleDeck(gameState: IGameState): void {
    const deck = gameState.deck as Deck;
    // Reshuffle discard pile into deck (excluding exploding kittens)
    const nonKittenDiscards = deck.discardPile.filter(
      (c: ICard) => c.type !== ExplodingKittensRuleSet.CARD_TYPES.EXPLODING_KITTEN
    );
    
    deck.discardPile = deck.discardPile.filter(
      (c: ICard) => c.type === ExplodingKittensRuleSet.CARD_TYPES.EXPLODING_KITTEN
    );

    deck.cards = [...nonKittenDiscards];
    deck.shuffle();
  }

  private createDeck(playerCount: number): ICard[] {
    const deck: ICard[] = [];
    let idCounter = 0;

    // Exploding Kittens (one fewer than players)
    for (let i = 0; i < playerCount - 1; i++) {
      deck.push({
        id: `ek_${idCounter++}`,
        type: ExplodingKittensRuleSet.CARD_TYPES.EXPLODING_KITTEN,
        metadata: {}
      });
    }

    // Defuses
    const defuseCount = playerCount >= 4 ? 6 : 5;
    for (let i = 0; i < defuseCount; i++) {
      deck.push({
        id: `defuse_${idCounter++}`,
        type: ExplodingKittensRuleSet.CARD_TYPES.DEFUSE,
        metadata: {}
      });
    }

    // Other cards would be added here...

    return deck;
  }
}
