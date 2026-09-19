"use strict";
/**
 * Socket Server for The Last Purr
 * Handles WebSocket connections, room management, and message routing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const socket_io_1 = require("socket.io");
const interfaces_1 = require("../core/interfaces");
const uuid_1 = require("uuid");
class GameServer {
    constructor(engine, config) {
        this.engine = engine;
        this.config = config;
        this.rooms = new Map();
        this.afkTimers = new Map();
        this.reconnectTimers = new Map();
        this.io = new socket_io_1.Server({
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:3000'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        this.setupSocketHandlers();
    }
    /**
     * Setup all socket event handlers
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            // Join a room
            socket.on('join_room', (data) => {
                this.handleJoinRoom(socket, data.roomId, data.playerName);
            });
            // Leave a room
            socket.on('leave_room', (data) => {
                this.handleLeaveRoom(socket, data.roomId);
            });
            // Start game
            socket.on('start_game', (data) => {
                this.handleStartGame(socket, data.roomId);
            });
            // Play action
            socket.on('play_action', (data) => {
                this.handlePlayAction(socket, data.roomId, data.action);
            });
            // Reconnect
            socket.on('reconnect', (data) => {
                this.handleReconnect(socket, data.roomId, data.playerId);
            });
            // Disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }
    /**
     * Handle player joining a room
     */
    handleJoinRoom(socket, roomId, playerName) {
        try {
            // Get or create room
            let room = this.rooms.get(roomId);
            if (!room) {
                room = this.engine.createRoom(roomId, 10); // Max 10 players
                this.rooms.set(roomId, room);
            }
            // Create player
            const player = (0, interfaces_1.createPlayer)((0, uuid_1.v4)(), playerName, socket.id);
            // Join room
            room = this.engine.joinRoom(room, player);
            this.rooms.set(roomId, room);
            // Join socket room
            socket.join(roomId);
            // Send confirmation to player
            socket.emit('room_joined', {
                roomId: room.id,
                playerId: player.id,
                players: Array.from(room.players.values())
            });
            // Broadcast to others
            socket.to(roomId).emit('player_joined', { player });
            console.log(`Player ${playerName} joined room ${roomId}`);
        }
        catch (error) {
            socket.emit('error', { message: error.message });
        }
    }
    /**
     * Handle player leaving a room
     */
    handleLeaveRoom(socket, roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
        if (!player)
            return;
        // Clear timers
        this.clearAfkTimer(player.id);
        this.clearReconnectTimer(player.id);
        // Leave room
        this.engine.leaveRoom(room, player.id);
        // Leave socket room
        socket.leave(roomId);
        // Broadcast to others
        socket.to(roomId).emit('player_left', { playerId: player.id });
        console.log(`Player ${player.name} left room ${roomId}`);
        // Clean up empty rooms
        if (room.players.size === 0 && room.status === 'LOBBY') {
            this.rooms.delete(roomId);
        }
    }
    /**
     * Handle starting the game
     */
    handleStartGame(socket, roomId) {
        let room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        // Verify player is in room
        const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
        if (!player) {
            socket.emit('error', { message: 'Not in room' });
            return;
        }
        try {
            room = this.engine.startGame(room);
            this.rooms.set(roomId, room);
            // Broadcast game started to all players
            const playersInRoom = Array.from(room.players.values());
            playersInRoom.forEach((p) => {
                const currentRoom = this.rooms.get(roomId);
                if (!currentRoom)
                    return;
                const sanitizedState = this.getSanitizedState(currentRoom, p.id);
                const playerSocket = this.io.sockets.sockets.get(p.socketId);
                if (playerSocket && !p.isDisconnected) {
                    playerSocket.emit('game_started', {
                        gameState: { ...sanitizedState, myPlayerId: p.id }
                    });
                }
            });
            // Start AFK timer for current player
            this.startAfkTimer(room, room.gameState.currentPlayerId);
            console.log(`Game started in room ${roomId}`);
        }
        catch (error) {
            socket.emit('error', { message: error.message });
        }
    }
    /**
     * Handle playing an action
     */
    handlePlayAction(socket, roomId, action) {
        let room = this.rooms.get(roomId);
        if (!room || !room.gameState) {
            socket.emit('error', { message: 'Game not in progress' });
            return;
        }
        // Add action ID if not present (for idempotency)
        if (!action.id) {
            action.id = (0, uuid_1.v4)();
        }
        try {
            room = this.engine.processAction(room, action);
            this.rooms.set(roomId, room);
            // Wait for action to be processed (in production, use proper async handling)
            setTimeout(() => {
                const currentRoom = this.rooms.get(roomId);
                if (!currentRoom || !currentRoom.gameState) {
                    return;
                }
                // Broadcast updated state to all players
                currentRoom.players.forEach((player) => {
                    const sanitizedState = this.engine.getSanitizedState(currentRoom, player.id);
                    const playerSocket = this.io.sockets.sockets.get(player.socketId);
                    if (playerSocket && !player.isDisconnected) {
                        playerSocket.emit('state_update', {
                            gameState: { ...sanitizedState, myPlayerId: player.id }
                        });
                    }
                });
                // Update AFK timer
                if (currentRoom.gameState?.currentPlayerId) {
                    this.startAfkTimer(currentRoom, currentRoom.gameState.currentPlayerId);
                }
            }, 50);
        }
        catch (error) {
            socket.emit('action_error', {
                actionId: action.id,
                message: error.message
            });
        }
    }
    /**
     * Handle player disconnect
     */
    handleDisconnect(socket) {
        console.log(`Client disconnected: ${socket.id}`);
        // Find player's room
        for (const [roomId, room] of this.rooms.entries()) {
            const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
            if (!player)
                continue;
            // Mark as disconnected
            this.engine.handleDisconnect(room, player.id);
            // Start reconnect timer
            this.startReconnectTimer(player.id, roomId);
            // If game is in progress and it's their turn, start AFK timer
            if (room.status === 'PLAYING' && room.gameState?.currentPlayerId === player.id) {
                this.startAfkTimer(room, player.id);
            }
            // Notify other players
            socket.to(roomId).emit('player_disconnected', {
                playerId: player.id,
                playerName: player.name
            });
            break;
        }
    }
    /**
     * Handle player reconnect
     */
    handleReconnect(socket, roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        const player = room.players.get(playerId);
        if (!player) {
            socket.emit('error', { message: 'Player not found' });
            return;
        }
        // Clear reconnect timer
        this.clearReconnectTimer(playerId);
        // Reconnect player
        this.engine.handleReconnect(room, playerId, socket.id);
        // Join socket room
        socket.join(roomId);
        // Send current state
        const sanitizedState = this.engine.getSanitizedState(room, playerId);
        socket.emit('room_joined', {
            roomId: room.id,
            playerId: player.id,
            players: Array.from(room.players.values()),
            gameState: sanitizedState,
            reconnected: true
        });
        // Notify others
        socket.to(roomId).emit('player_reconnected', { playerId, playerName: player.name });
        console.log(`Player ${player.name} reconnected to room ${roomId}`);
    }
    /**
     * Start AFK timer for a player
     */
    startAfkTimer(room, playerId) {
        this.clearAfkTimer(playerId);
        const timeout = setTimeout(() => {
            console.log(`Player ${playerId} AFK timeout in room ${room.id}`);
            // Auto-pass turn
            if (room.gameState) {
                const passAction = {
                    id: (0, uuid_1.v4)(),
                    playerId,
                    type: 'PASS',
                    metadata: {},
                    createdAt: Date.now()
                };
                room = this.engine.processAction(room, passAction);
                this.rooms.set(room.id, room);
            }
        }, this.config.afkTimeoutMs);
        this.afkTimers.set(playerId, timeout);
    }
    /**
     * Clear AFK timer
     */
    clearAfkTimer(playerId) {
        const timer = this.afkTimers.get(playerId);
        if (timer) {
            clearTimeout(timer);
            this.afkTimers.delete(playerId);
        }
    }
    /**
     * Start reconnect timer
     */
    startReconnectTimer(playerId, roomId) {
        this.clearReconnectTimer(playerId);
        const timeout = setTimeout(() => {
            console.log(`Player ${playerId} reconnect timeout in room ${roomId}`);
            const room = this.rooms.get(roomId);
            if (room) {
                // Player didn't reconnect - keep them disconnected
                // In some games, you might want to remove them entirely
            }
        }, this.config.reconnectTimeoutMs);
        this.reconnectTimers.set(playerId, { playerId, roomId, timeout });
    }
    /**
     * Clear reconnect timer
     */
    clearReconnectTimer(playerId) {
        const entry = this.reconnectTimers.get(playerId);
        if (entry) {
            clearTimeout(entry.timeout);
            this.reconnectTimers.delete(playerId);
        }
    }
    /**
     * Get sanitized state for a player
     */
    getSanitizedState(room, playerId) {
        return this.engine.getSanitizedState(room, playerId);
    }
    /**
     * Start the server
     */
    start() {
        this.io.listen(this.config.port);
        console.log(`The Last Purr server running on port ${this.config.port}`);
    }
    /**
     * Stop the server
     */
    stop() {
        // Clear all timers
        this.afkTimers.forEach(timer => clearTimeout(timer));
        this.reconnectTimers.forEach(entry => clearTimeout(entry.timeout));
        this.io.close();
        console.log('Server stopped');
    }
}
exports.GameServer = GameServer;
//# sourceMappingURL=GameServer.js.map