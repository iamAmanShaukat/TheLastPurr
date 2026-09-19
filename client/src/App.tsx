import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/GameBoard';

function App() {
  const { connect, isConnected, gameState, socket, roomId } = useGameStore();
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    // Auto-connect to a default room for testing
    const roomId = 'test-room-1';
    const playerName = `Player-${Math.random().toString(36).substring(7)}`;
    connect(roomId, playerName);
  }, [connect]);

  // Listen for room_joined to set hasJoined
  useEffect(() => {
    if (socket) {
      socket.on('room_joined', () => {
        setHasJoined(true);
      });
      
      return () => {
        socket.off('room_joined');
      };
    }
  }, [socket]);

  const handleStartGame = () => {
    if (socket && roomId) {
      socket.emit('start_game', { roomId });
    }
  };

  return (
    <div className="App">
      {!isConnected ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
          <div className="text-white text-2xl animate-pulse">Connecting to server...</div>
        </div>
      ) : !hasJoined ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
          <div className="text-white text-2xl animate-pulse">Joining room...</div>
        </div>
      ) : !gameState ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center flex-col gap-4">
          <div className="text-white text-2xl">Waiting for game to start...</div>
          <button
            onClick={handleStartGame}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🎮 Start Game (Host Only)
          </button>
        </div>
      ) : (
        <GameBoard />
      )}
    </div>
  );
}

export default App;
