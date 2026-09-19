/**
 * Base RuleSet Implementation
 * Provides default implementations that can be overridden by specific games
 */

import { 
  IRuleSet, 
  IGameState, 
  IAction, 
  ICard,
  ActionType,
  PlayerStatus
} from '../core/interfaces';
import { Deck } from '../core/deck';

export abstract class BaseRuleSet implements IRuleSet {
  public abstract gameName: string;

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
  getNextPlayerId(gameState: IGameState, currentId: string): string | null {
    const activePlayers = gameState.players.filter(
      p => p.status === 'PLAYING' && !p.isDisconnected
    );

    if (activePlayers.length === 0) {
      return null;
    }

    const currentIndex = activePlayers.findIndex(p => p.id === currentId);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    
    return activePlayers[nextIndex].id;
  }

  /**
   * Check if a player can play a card
   * Default implementation - override for game-specific rules
   */
  canPlayCard(gameState: IGameState, playerId: string, card: ICard): boolean {
    // Must be player's turn (unless game allows otherwise)
    if (gameState.currentPlayerId !== playerId) {
      return false;
    }

    // Must be in main phase or appropriate phase
    if (gameState.phase !== 'MAIN_PHASE') {
      return false;
    }

    // Player must have the card
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.hand.some(c => c.id === card.id)) {
      return false;
    }

    return true;
  }

  /**
   * Check if a player can respond out of turn (e.g., with a Nope)
   * Default: only NOPE actions can be done out of turn
   */
  canRespondOutOfTurn(
    gameState: IGameState, 
    playerId: string, 
    actionType: ActionType
  ): boolean {
    // Only Nope can be played out of turn by default
    if (actionType === 'NOPE') {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player || player.status !== 'PLAYING' || player.isDisconnected) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Validate an action
   * Default implementation - override for game-specific rules
   */
  validateAction(gameState: IGameState, action: IAction): boolean {
    const player = gameState.players.find(p => p.id === action.playerId);
    
    if (!player) {
      return false;
    }

    if (player.status !== 'PLAYING' && player.status !== 'WAITING') {
      return false;
    }

    // Basic validation - delegate to specific validators
    switch (action.type) {
      case 'PLAY_CARD':
        if (!action.cardId) return false;
        const card = player.hand.find(c => c.id === action.cardId);
        if (!card) return false;
        return this.canPlayCard(gameState, action.playerId, card);
      
      case 'NOPE':
        return this.canRespondOutOfTurn(gameState, action.playerId, 'NOPE');
      
      case 'PASS':
      case 'DRAW':
        return gameState.currentPlayerId === action.playerId;
      
      default:
        return true;
    }
  }

  /**
   * Resolve an action
   * Default implementation handles common actions
   * Override for game-specific logic
   */
  resolveAction(gameState: IGameState, action: IAction): IGameState {
    let newState = { ...gameState };

    switch (action.type) {
      case 'PLAY_CARD':
        newState = this.resolvePlayCard(newState, action);
        break;
      
      case 'NOPE':
        newState = this.resolveNope(newState, action);
        break;
      
      case 'PASS':
        newState = this.endTurn(newState);
        break;
      
      case 'DRAW':
        newState = this.resolveDraw(newState, action);
        break;
      
      default:
        // Game-specific actions handled by subclasses
        newState = this.resolveCustomAction(newState, action);
    }

    // Check win condition after each action
    newState = this.checkWinCondition(newState);

    return newState;
  }

  /**
   * Resolve playing a card
   */
  protected resolvePlayCard(gameState: IGameState, action: IAction): IGameState {
    const playerIndex = gameState.players.findIndex(p => p.id === action.playerId);
    if (playerIndex === -1 || !action.cardId) {
      return gameState;
    }

    const player = gameState.players[playerIndex];
    const cardIndex = player.hand.findIndex(c => c.id === action.cardId);
    
    if (cardIndex === -1) {
      return gameState;
    }

    // Remove card from hand
    const [card] = player.hand.splice(cardIndex, 1);
    
    // Add to discard pile
    const deck = gameState.deck as Deck;
    deck.addToDiscard([card]);

    // Log the action
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: action.playerId,
      action: 'PLAY_CARD',
      details: { cardType: card.type }
    });

    return gameState;
  }

  /**
   * Resolve a Nope action
   */
  protected resolveNope(gameState: IGameState, action: IAction): IGameState {
    // Add to action stack for LIFO resolution
    gameState.actionStack.push(action);
    gameState.phase = 'RESOLVING_STACK';

    // Log the action
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: action.playerId,
      action: 'NOPE',
      details: { respondedTo: action.respondedTo }
    });

    return gameState;
  }

  /**
   * Resolve a draw action
   */
  protected resolveDraw(gameState: IGameState, action: IAction): IGameState {
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      return gameState;
    }

    const deck = gameState.deck as Deck;
    const cardsToDraw = action.metadata?.count || 1;
    const drawnCards = deck.draw(cardsToDraw);

    // Add cards to player's hand
    player.hand.push(...drawnCards);

    // Log the action
    gameState.gameLog.push({
      timestamp: Date.now(),
      playerId: action.playerId,
      action: 'DRAW',
      details: { count: drawnCards.length }
    });

    return gameState;
  }

  /**
   * Resolve custom/game-specific actions
   * Override in subclasses for game-specific logic
   */
  protected resolveCustomAction(gameState: IGameState, action: IAction): IGameState {
    // Default: no-op, subclasses should override
    console.warn(`Unhandled action type: ${action.type}`);
    return gameState;
  }

  /**
   * Sanitize game state for a specific player
   * Hides other players' hands and sensitive information
   */
  sanitizeStateForPlayer(gameState: IGameState, playerId: string): IGameState {
    const sanitized = JSON.parse(JSON.stringify(gameState));

    // Hide other players' hands
    sanitized.players = sanitized.players.map((player: any) => {
      if (player.id === playerId) {
        return player; // Return full info for current player
      }

      // Hide hand details for other players
      return {
        ...player,
        hand: Array(player.hand.length).fill({ type: 'hidden' })
      };
    });

    return sanitized;
  }
}
