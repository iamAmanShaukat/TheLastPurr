"use strict";
/**
 * Core Interfaces for The Last Purr Game Engine
 * These interfaces define the contract for all game components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCard = createCard;
exports.createPlayer = createPlayer;
const uuid_1 = require("uuid");
function createCard(type, metadata = {}) {
    return {
        id: (0, uuid_1.v4)(),
        type,
        metadata
    };
}
function createPlayer(id, name, socketId) {
    return {
        id,
        name,
        socketId,
        hand: [],
        status: 'WAITING',
        isDisconnected: false,
        lastActiveAt: Date.now()
    };
}
//# sourceMappingURL=interfaces.js.map