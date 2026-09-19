import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/GameBoard';

function App() {
  const { connect, isConnected, gameState } = useGameStore();

  useEffect(() => {
    // Auto-connect to a default room for testing
    const roomId = 'test-room-1';
    const playerName = `Player-${Math.random().toString(36).substring(7)}`;
    connect(roomId, playerName);
  }, [connect]);

  return (
    <div className="App">
      {!isConnected ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
          <div className="text-white text-2xl animate-pulse">Connecting to server...</div>
        </div>
      ) : !gameState ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
          <div className="text-white text-2xl animate-pulse">Waiting for game state...</div>
        </div>
      ) : (
        <GameBoard />
      )}
    </div>
  );
}

export default App;