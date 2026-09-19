/**
 * Server Entry Point for The Last Purr
 * Initializes and starts the game server with Exploding Kittens rules
 */

import { GameEngine } from './engine/GameEngine';
import { GameServer } from './server/GameServer';
import { ExplodingKittensRuleSet } from './games/exploding-kittens/ExplodingKittensRuleSet';

// Configuration
const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  afkTimeoutMs: 60000, // 60 seconds
  reconnectTimeoutMs: 60000 // 60 seconds
};

// Initialize the game engine with Exploding Kittens rules
const ruleSet = new ExplodingKittensRuleSet();
const engine = new GameEngine(ruleSet);

// Create and start the server
const server = new GameServer(engine, config);

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
