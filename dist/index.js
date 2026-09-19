"use strict";
/**
 * Server Entry Point for The Last Purr
 * Initializes and starts the game server with Exploding Kittens rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
const GameEngine_1 = require("./engine/GameEngine");
const GameServer_1 = require("./server/GameServer");
const ExplodingKittensRuleSet_1 = require("./games/exploding-kittens/ExplodingKittensRuleSet");
// Configuration
const config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    afkTimeoutMs: 60000, // 60 seconds
    reconnectTimeoutMs: 60000 // 60 seconds
};
// Initialize the game engine with Exploding Kittens rules
const ruleSet = new ExplodingKittensRuleSet_1.ExplodingKittensRuleSet();
const engine = new GameEngine_1.GameEngine(ruleSet);
// Create and start the server
const server = new GameServer_1.GameServer(engine, config);
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    server.stop();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    server.stop();
    process.exit(0);
});
// Start the server
server.start();
console.log(`
╔════════════════════════════════════════╗
║        🐱 THE LAST PURR 🐱            ║
║     Multiplayer Card Game Engine      ║
║                                      ║
║     Server running on port ${config.port}      ║
║     Game: Exploding Kittens           ║
╚════════════════════════════════════════╝
`);
//# sourceMappingURL=index.js.map