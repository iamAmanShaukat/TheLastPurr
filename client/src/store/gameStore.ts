import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { IGameState } from '../types/game';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface GameState {
  socket: Socket | null;
  isConnected: boolean;
  roomId: string | null;
  playerId: string | null;
  playerName: string | null;
  gameState: IGameState | null;
  lobbyPlayers: Player[];
  isHost: boolean;
  error: string | null;
  
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
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
  playerName: null,
  gameState: null,
  lobbyPlayers: [],
  isHost: false,
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

    socket.on('room_joined', (data: { roomId: string; playerId: string; players: string[]; isHost: boolean }) => {
      console.log('Joined room:', data);
      set({ 
        playerId: data.playerId, 
        roomId: data.roomId,
        isHost: data.isHost,
        lobbyPlayers: data.players.map((id, index) => ({
          id,
          name: index === 0 ? 'Player ' + (index + 1) : 'Player ' + (index + 1),
          isHost: index === 0
        }))
      });
    });

    socket.on('player_joined', (data: { playerId: string }) => {
      console.log('Player joined:', data);
      const { lobbyPlayers } = get();
      set({
        lobbyPlayers: [...lobbyPlayers, {
          id: data.playerId,
          name: `Player ${lobbyPlayers.length + 1}`,
          isHost: lobbyPlayers.length === 0
        }]
      });
    });

    socket.on('player_left', (data: { playerId: string }) => {
      console.log('Player left:', data);
      const { lobbyPlayers } = get();
      set({
        lobbyPlayers: lobbyPlayers.filter(p => p.id !== data.playerId)
      });
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
      set({ socket: null, isConnected: false, roomId: null, playerId: null, playerName: null, gameState: null, lobbyPlayers: [], isHost: false });
    }
  },

  joinRoom: (roomId: string, playerName: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join_room', { roomId, playerName });
      set({ playerName });
    }
  },

  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leave_room', { roomId });
    }
    set({ roomId: null, playerId: null, playerName: null, lobbyPlayers: [], isHost: false, gameState: null });
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
