"use strict";
/**
 * Base Game Engine Implementation
 * Handles room management, action processing, and state synchronization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const deck_1 = require("../core/deck");
class GameEngine {
    constructor(ruleSet) {
        // Processed action IDs for idempotency (per room)
        this.processedActions = new Map();
        // Room-level locks for concurrency control
        this.roomLocks = new Map();
        this.ruleSet = ruleSet;
    }
    /**
     * Create a new game room
     */
    createRoom(roomId, maxPlayers) {
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
    joinRoom(room, player) {
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
    leaveRoom(room, playerId) {
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
    processAction(room, action) {
        // Check idempotency
        if (!this.processedActions.has(room.id)) {
            this.processedActions.set(room.id, new Set());
        }
        const processedSet = this.processedActions.get(room.id);
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
                    arr.splice(0, arr.length - 100);
                    this.processedActions.set(room.id, new Set(arr));
                }
            }
            catch (error) {
                console.error(`Error processing action ${action.id}:`, error);
                throw error;
            }
        })();
        this.roomLocks.set(room.id, newLock);
        // Return room immediately (action will be processed asynchronously)
        // In production, you might want to wait for the lock
        return room;
    }
    /**
     * Validate an action before execution
     */
    validateAction(room, action) {
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
    executeAction(room, action) {
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
    handleDisconnect(room, playerId) {
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
    handleReconnect(room, playerId, socketId) {
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
    getSanitizedState(room, playerId) {
        if (!room.gameState) {
            return null;
        }
        return this.ruleSet.sanitizeStateForPlayer(room.gameState, playerId);
    }
    /**
     * Deep clone game state
     */
    cloneGameState(state) {
        return JSON.parse(JSON.stringify(state));
    }
    /**
     * Start the game (transition from LOBBY to PLAYING)
     */
    startGame(room) {
        if (room.status !== 'LOBBY') {
            throw new Error('Game already started');
        }
        if (room.players.size < 2) {
            throw new Error('Need at least 2 players');
        }
        // Initialize game state
        const now = Date.now();
        const initialState = {
            roomId: room.id,
            phase: 'DEALING',
            players: Array.from(room.players.values()).map(p => ({
                ...p,
                status: 'PLAYING',
                hand: []
            })),
            currentPlayerId: null,
            deck: new deck_1.Deck(),
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
exports.GameEngine = GameEngine;
//# sourceMappingURL=GameEngine.js.map