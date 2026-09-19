import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { IGameState } from '../types/game';

interface GameState {
  socket: Socket | null;
  isConnected: boolean;
  roomId: string | null;
  playerId: string | null;
  gameState: IGameState | null;
  error: string | null;
  
  connect: (roomId: string, playerName: string) => void;
  disconnect: () => void;
  playCard: (cardId: string, targetId?: string, targetIndex?: number) => void;
  drawCard: () => void;
  endTurn: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  isConnected: false,
  roomId: null,
  playerId: null,
  gameState: null,
  error: null,

  connect: (roomId: string, playerName: string) => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
      upgrade: false,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      set({ isConnected: true, roomId });
      
      // Join room
      socket.emit('join_room', { roomId, playerName });
    });

    socket.on('game_state', (state: IGameState & { myPlayerId: string }) => {
      console.log('Received game state:', state);
      set({ 
        gameState: {
          status: state.status,
          currentPlayerId: state.currentPlayerId,
          phase: state.phase,
          deckCount: state.deckCount,
          discardPile: state.discardPile,
          players: state.players,
          actionStack: state.actionStack,
          metadata: state.metadata,
          winnerId: state.winnerId,
        },
        playerId: state.myPlayerId,
      });
    });

    socket.on('error', (message: string) => {
      console.error('Socket error:', message);
      set({ error: message });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      set({ isConnected: false });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, roomId: null, playerId: null, gameState: null });
    }
  },

  playCard: (cardId: string, targetId?: string, targetIndex?: number) => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('action', {
        roomId,
        actionId: crypto.randomUUID(),
        playerId: get().playerId!,
        action: 'PLAY_CARD',
        cardId,
        targetId,
        targetIndex,
      });
    }
  },

  drawCard: () => {
    const { socket, roomId, playerId } = get();
    if (socket && roomId && playerId) {
      socket.emit('action', {
        roomId,
        actionId: crypto.randomUUID(),
        playerId,
        action: 'DRAW_CARD',
      });
    }
  },

  endTurn: () => {
    const { socket, roomId, playerId } = get();
    if (socket && roomId && playerId) {
      socket.emit('action', {
        roomId,
        actionId: crypto.randomUUID(),
        playerId,
        action: 'END_TURN',
      });
    }
  },
}));