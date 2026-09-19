/**
 * Base Game Engine Implementation
 * Handles room management, action processing, and state synchronization
 */

import { 
  IGameEngine, 
  IRoom, 
  IPlayer, 
  IAction, 
  IGameState,
  IRuleSet,
  ISocketMessage,
  PlayerStatus
} from '../core/interfaces';
import { Deck } from '../core/deck';

export class GameEngine implements IGameEngine {
  public ruleSet: IRuleSet;
  
  // Processed action IDs for idempotency (per room)
  private processedActions: Map<string, Set<string>> = new Map();
  
  // Room-level locks for concurrency control
  private roomLocks: Map<string, Promise<void>> = new Map();

  constructor(ruleSet: IRuleSet) {
    this.ruleSet = ruleSet;
  }

  /**
   * Create a new game room
   */
  createRoom(roomId: string, maxPlayers: number): IRoom {
    return {
      id: roomId,
      gameState: null,
      players: new Map(),
      maxPlayers,
      status: 'LOBBY',
      createdAt: Date.now()
    };
  }

  /**
   * Add a player to a room
   */
  joinRoom(room: IRoom, player: IPlayer): IRoom {
    if (room.status !== 'LOBBY') {
      throw new Error('Game already in progress');
    }

    if (room.players.size >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    if (room.players.has(player.id)) {
      throw new Error('Player already in room');
    }

    room.players.set(player.id, player);
    return room;
  }

  /**
   * Remove a player from a room
   */
  leaveRoom(room: IRoom, playerId: string): IRoom {
    const player = room.players.get(playerId);
    if (player) {
      player.isDisconnected = true;
      player.status = 'DISCONNECTED';
      
      // If game hasn't started, remove player entirely
      if (room.status === 'LOBBY') {
        room.players.delete(playerId);
      }
    }
    
    return room;
  }

  /**
   * Process an action with locking and idempotency checks
   */
  async processAction(room: IRoom, action: IAction): Promise<IRoom> {
    // Check idempotency
    if (!this.processedActions.has(room.id)) {
      this.processedActions.set(room.id, new Set());
    }
    
    const processedSet = this.processedActions.get(room.id)!;
    if (processedSet.has(action.id)) {
      // Action already processed, return current state
      return room;
    }

    // Acquire room lock
    const lock = this.roomLocks.get(room.id) || Promise.resolve();
    
    const newLock = (async () => {
      await lock;
      
      try {
        // Double-check idempotency after acquiring lock
        if (processedSet.has(action.id)) {
          return;
        }

        // Validate action
        if (!this.validateAction(room, action)) {
          throw new Error('Invalid action');
        }

        // Update player's last active time
        const player = room.gameState?.players.find(p => p.id === action.playerId);
        if (player) {
          player.lastActiveAt = Date.now();
        }

        // Process the action through the rule set
        room = this.executeAction(room, action);

        // Mark action as processed
        processedSet.add(action.id);

        // Cleanup old processed actions (keep last 100 per room)
        if (processedSet.size > 100) {
          const arr = Array.from(processedSet);
          processedSet.clear();
          // Keep only the last 100 action IDs
          const startIndex = Math.max(0, arr.length - 100);
          for (let i = startIndex; i < arr.length; i++) {
            processedSet.add(arr[i]);
          }
        }
      } catch (error) {
        console.error(`Error processing action ${action.id}:`, error);
        throw error;
      }
    })();

    this.roomLocks.set(room.id, newLock);
    
    // Wait for the action to be fully processed before returning
    await newLock;
    
    return room;
  }

  /**
   * Validate an action before execution
   */
  private validateAction(room: IRoom, action: IAction): boolean {
    if (!room.gameState) {
      return false;
    }

    const { gameState } = room;
    const player = gameState.players.find(p => p.id === action.playerId);

    // Player must exist and be active
    if (!player || player.status === 'ELIMINATED' || player.isDisconnected) {
      return false;
    }

    // Check if player can perform this action
    const isCurrentPlayer = gameState.currentPlayerId === action.playerId;
    const canRespondOutOfTurn = this.ruleSet.canRespondOutOfTurn(gameState, action.playerId, action.type);

    if (!isCurrentPlayer && !canRespondOutOfTurn) {
      return false;
    }

    // Delegate to rule set for specific validation
    return this.ruleSet.validateAction(gameState, action);
  }

  /**
   * Execute an action and update game state
   */
  private executeAction(room: IRoom, action: IAction): IRoom {
    if (!room.gameState) {
      throw new Error('No game state available');
    }

    // Clone state to avoid mutations
    let newState = this.cloneGameState(room.gameState);

    // Resolve action through rule set
    newState = this.ruleSet.resolveAction(newState, action);

    // Update timestamp
    newState.lastUpdatedAt = Date.now();

    room.gameState = newState;
    return room;
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(room: IRoom, playerId: string): IRoom {
    const player = room.players.get(playerId);
    if (player) {
      player.isDisconnected = true;
      player.status = 'DISCONNECTED';
    }

    // If game is playing, set up auto-play timer (handled by server)
    if (room.status === 'PLAYING' && room.gameState) {
      room.gameState.lastUpdatedAt = Date.now();
    }

    return room;
  }

  /**
   * Handle player reconnect
   */
  handleReconnect(room: IRoom, playerId: string, socketId: string): IRoom {
    const player = room.players.get(playerId);
    if (player) {
      player.isDisconnected = false;
      player.socketId = socketId;
      player.status = player.status === 'DISCONNECTED' ? 'PLAYING' : player.status;
      player.lastActiveAt = Date.now();
    }

    return room;
  }

  /**
   * Get sanitized game state for a specific player
   * This ensures players only see information they're allowed to see
   */
  getSanitizedState(room: IRoom, playerId: string): IGameState | null {
    if (!room.gameState) {
      return null;
    }

    return this.ruleSet.sanitizeStateForPlayer(room.gameState, playerId);
  }

  /**
   * Deep clone game state while preserving Deck class instance
   */
  private cloneGameState(state: IGameState): IGameState {
    // Clone the state without the deck first
    const clonedState = JSON.parse(JSON.stringify({
      ...state,
      deck: null
    })) as IGameState;
    
    // Preserve the Deck instance by creating a new one with same data
    if (state.deck instanceof Deck) {
      clonedState.deck = new Deck(
        state.deck.cards.map(card => ({ ...card })),
        state.deck.discardPile.map(card => ({ ...card }))
      );
    } else {
      // Fallback for non-Deck instances
      clonedState.deck = JSON.parse(JSON.stringify(state.deck));
    }
    
    return clonedState;
  }

  /**
   * Start the game (transition from LOBBY to PLAYING)
   */
  startGame(room: IRoom): IRoom {
    if (room.status !== 'LOBBY') {
      throw new Error('Game already started');
    }

    if (room.players.size < 2) {
      throw new Error('Need at least 2 players');
    }

    // Initialize game state
    const now = Date.now();
    const initialState: IGameState = {
      roomId: room.id,
      phase: 'DEALING',
      players: Array.from(room.players.values()).map(p => ({
        ...p,
        status: 'PLAYING' as PlayerStatus,
        hand: []
      })),
      currentPlayerId: null,
      deck: new Deck(),
      actionStack: [],
      gameLog: [],
      winnerId: null,
      createdAt: now,
      lastUpdatedAt: now
    };

    // Let rule set setup the game
    room.gameState = this.ruleSet.setupGame(initialState, room.players.size);
    room.status = 'PLAYING';

    return room;
  }
}
