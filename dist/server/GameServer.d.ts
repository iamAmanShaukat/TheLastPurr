/**
 * Socket Server for The Last Purr
 * Handles WebSocket connections, room management, and message routing
 */
import { GameEngine } from '../engine/GameEngine';
export interface ServerConfig {
    port: number;
    corsOrigins: string[];
    afkTimeoutMs: number;
    reconnectTimeoutMs: number;
}
export declare class GameServer {
    private io;
    private config;
    private rooms;
    private engine;
    private afkTimers;
    private reconnectTimers;
    constructor(engine: GameEngine, config: ServerConfig);
    /**
     * Setup all socket event handlers
     */
    private setupSocketHandlers;
    /**
     * Handle player joining a room
     */
    private handleJoinRoom;
    /**
     * Handle player leaving a room
     */
    private handleLeaveRoom;
    /**
     * Handle starting the game
     */
    private handleStartGame;
    /**
     * Handle playing an action
     */
    private handlePlayAction;
    /**
     * Handle player disconnect
     */
    private handleDisconnect;
    /**
     * Handle player reconnect
     */
    private handleReconnect;
    /**
     * Start AFK timer for a player
     */
    private startAfkTimer;
    /**
     * Clear AFK timer
     */
    private clearAfkTimer;
    /**
     * Start reconnect timer
     */
    private startReconnectTimer;
    /**
     * Clear reconnect timer
     */
    private clearReconnectTimer;
    /**
     * Get sanitized state for a player
     */
    private getSanitizedState;
    /**
     * Start the server
     */
    start(): void;
    /**
     * Stop the server
     */
    stop(): void;
}
//# sourceMappingURL=GameServer.d.ts.map