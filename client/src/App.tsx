import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/GameBoard';

function App() {
  const { isConnected, gameState, socket, roomId, joinRoom } = useGameStore();
  
  // Lobby State
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  // Handle joining the room
  const handleJoin = () => {
    if (!playerName.trim() || !roomIdInput.trim()) return;
    joinRoom(roomIdInput.trim(), playerName.trim());
    setHasJoined(true);
  };

  const handleStartGame = () => {
    if (socket && roomId) {
      socket.emit('start_game', { roomId });
    }
  };

  // Show Lobby Screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-4xl font-bold text-white text-center mb-2">🐱 The Last Purr</h1>
          <p className="text-gray-400 text-center mb-6">Multiplayer Card Game Engine</p>
          
          {!isConnected ? (
            <div className="text-white text-center animate-pulse">Connecting to server...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g., Alice"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={12}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Room ID</label>
                <input
                  type="text"
                  placeholder="e.g., room-123"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-gray-500 text-sm mt-1">Enter an existing room ID or create a new one.</p>
              </div>

              <button 
                onClick={handleJoin}
                disabled={!playerName.trim() || !roomIdInput.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Join Game
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center flex-col gap-4">
        <div className="text-white text-2xl">Waiting for game to start...</div>
        <button
          onClick={handleStartGame}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          🎮 Start Game (Host Only)
        </button>
      </div>
    );
  }

  // Show Game Board
  return <GameBoard />;
}

export default App;
