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
  
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string, playerName: string) => void;
  startGame: (roomId: string) => void;
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
  
  connect: () => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
      upgrade: false,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      set({ isConnected: true });
    });

    socket.on('room_joined', (data: { roomId: string; playerId: string; players: any[] }) => {
      console.log('Joined room:', data);
      set({ playerId: data.playerId, roomId: data.roomId });
    });

    socket.on('game_started', (data: { gameState: IGameState & { myPlayerId: string } }) => {
      console.log('Game started:', data);
      set({ 
        gameState: data.gameState,
        playerId: data.gameState.myPlayerId,
      });
    });

    socket.on('state_update', (data: { gameState: IGameState & { myPlayerId: string } }) => {
      console.log('State update:', data);
      set({ 
        gameState: data.gameState,
        playerId: data.gameState.myPlayerId,
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

  joinRoom: (roomId: string, playerName: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join_room', { roomId, playerName });
    }
  },

  startGame: (roomId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('start_game', { roomId });
    }
  },

  playCard: (cardId: string, targetId?: string, targetIndex?: number) => {
    const { socket, roomId, playerId } = get();
    if (socket && roomId && playerId) {
      socket.emit('play_action', {
        roomId,
        action: {
          id: crypto.randomUUID(),
          playerId,
          action: 'PLAY_CARD',
          cardId,
          targetId,
          targetIndex,
        },
      });
    }
  },

  drawCard: () => {
    const { socket, roomId, playerId } = get();
    if (socket && roomId && playerId) {
      socket.emit('play_action', {
        roomId,
        action: {
          id: crypto.randomUUID(),
          playerId,
          action: 'DRAW_CARD',
        },
      });
    }
  },

  endTurn: () => {
    const { socket, roomId, playerId } = get();
    if (socket && roomId && playerId) {
      socket.emit('play_action', {
        roomId,
        action: {
          id: crypto.randomUUID(),
          playerId,
          action: 'END_TURN',
        },
      });
    }
  },
}));
