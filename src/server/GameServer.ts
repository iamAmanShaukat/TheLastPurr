/**
 * Socket Server for The Last Purr
 * Handles WebSocket connections, room management, and message routing
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameEngine } from '../engine/GameEngine';
import { IRuleSet, IPlayer, IAction, IRoom } from '../core/interfaces';
import { createPlayer } from '../core/interfaces';
import { v4 as uuidv4 } from 'uuid';

export interface ServerConfig {
  port: number;
  corsOrigins: string[];
  afkTimeoutMs: number;
  reconnectTimeoutMs: number;
}

export class GameServer {
  private io: SocketIOServer;
  private config: ServerConfig;
  private rooms: Map<string, IRoom>;
  private engine: GameEngine;
  private afkTimers: Map<string, NodeJS.Timeout>;
  private reconnectTimers: Map<string, { playerId: string; roomId: string; timeout: NodeJS.Timeout }>;

  constructor(engine: GameEngine, config: ServerConfig) {
    this.engine = engine;
    this.config = config;
    this.rooms = new Map();
    this.afkTimers = new Map();
    this.reconnectTimers = new Map();
    
    this.io = new SocketIOServer({
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
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join a room
      socket.on('join_room', (data: { roomId: string; playerName: string }) => {
        this.handleJoinRoom(socket, data.roomId, data.playerName);
      });

      // Leave a room
      socket.on('leave_room', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId);
      });

      // Start game
      socket.on('start_game', (data: { roomId: string }) => {
        this.handleStartGame(socket, data.roomId);
      });

      // Play action
      socket.on('play_action', (data: { roomId: string; action: IAction }) => {
        this.handlePlayAction(socket, data.roomId, data.action);
      });

      // Reconnect
      socket.on('reconnect', (data: { roomId: string; playerId: string }) => {
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
  private handleJoinRoom(socket: Socket, roomId: string, playerName: string): void {
    try {
      // Get or create room
      let room = this.rooms.get(roomId);
      
      if (!room) {
        room = this.engine.createRoom(roomId, 10); // Max 10 players
        this.rooms.set(roomId, room);
      }

      // Create player
      const player: IPlayer = createPlayer(uuidv4(), playerName, socket.id);

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
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handle player leaving a room
   */
  private handleLeaveRoom(socket: Socket, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
    if (!player) return;

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
  private handleStartGame(socket: Socket, roomId: string): void {
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
      this.io.to(roomId).emit('game_started', {
        gameState: this.getSanitizedState(room, player.id)
      });

      // Start AFK timer for current player
      this.startAfkTimer(room, room.gameState!.currentPlayerId!);

      console.log(`Game started in room ${roomId}`);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handle playing an action
   */
  private handlePlayAction(socket: Socket, roomId: string, action: IAction): void {
    let room = this.rooms.get(roomId);
    if (!room || !room.gameState) {
      socket.emit('error', { message: 'Game not in progress' });
      return;
    }

    // Add action ID if not present (for idempotency)
    if (!action.id) {
      action.id = uuidv4();
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
            playerSocket.emit('state_update', { gameState: sanitizedState });
          }
        });

        // Update AFK timer
        if (currentRoom.gameState?.currentPlayerId) {
          this.startAfkTimer(currentRoom, currentRoom.gameState.currentPlayerId);
        }
      }, 50);

    } catch (error: any) {
      socket.emit('action_error', { 
        actionId: action.id, 
        message: error.message 
      });
    }
  }

  /**
   * Handle player disconnect
   */
  private handleDisconnect(socket: Socket): void {
    console.log(`Client disconnected: ${socket.id}`);

    // Find player's room
    for (const [roomId, room] of this.rooms.entries()) {
      const player = Array.from(room.players.values()).find(p => p.socketId === socket.id);
      if (!player) continue;

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
  private handleReconnect(socket: Socket, roomId: string, playerId: string): void {
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
  private startAfkTimer(room: IRoom, playerId: string): void {
    this.clearAfkTimer(playerId);

    const timeout = setTimeout(() => {
      console.log(`Player ${playerId} AFK timeout in room ${room.id}`);
      
      // Auto-pass turn
      if (room.gameState) {
        const passAction: IAction = {
          id: uuidv4(),
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
  private clearAfkTimer(playerId: string): void {
    const timer = this.afkTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.afkTimers.delete(playerId);
    }
  }

  /**
   * Start reconnect timer
   */
  private startReconnectTimer(playerId: string, roomId: string): void {
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
  private clearReconnectTimer(playerId: string): void {
    const entry = this.reconnectTimers.get(playerId);
    if (entry) {
      clearTimeout(entry.timeout);
      this.reconnectTimers.delete(playerId);
    }
  }

  /**
   * Get sanitized state for a player
   */
  private getSanitizedState(room: IRoom, playerId: string) {
    return this.engine.getSanitizedState(room, playerId);
  }

  /**
   * Start the server
   */
  public start(): void {
    this.io.listen(this.config.port);
    console.log(`The Last Purr server running on port ${this.config.port}`);
  }

  /**
   * Stop the server
   */
  public stop(): void {
    // Clear all timers
    this.afkTimers.forEach(timer => clearTimeout(timer));
    this.reconnectTimers.forEach(entry => clearTimeout(entry.timeout));
    
    this.io.close();
    console.log('Server stopped');
  }
}
