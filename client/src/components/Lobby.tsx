import { useGameStore } from '../store/gameStore';

interface LobbyProps {
  onLeave: () => void;
}

export function Lobby({ onLeave }: LobbyProps) {
  const { socket, roomId, playerId, playerName, startGame, isHost, lobbyPlayers } = useGameStore();

  const handleStartGame = () => {
    if (socket && roomId) {
      startGame(roomId);
    }
  };

  // Get display name for each player
  const getDisplayName = (player: any, index: number) => {
    if (player.id === playerId) {
      return `${playerName || 'You'}${isHost ? ' (Host)' : ''}`;
    }
    return player.name || `Player ${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-white text-center mb-2">🐱 The Last Purr</h1>
        <p className="text-gray-400 text-center mb-6">Multiplayer Card Game Engine</p>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Lobby</h2>
            <span className="text-gray-400 text-sm">Room: {roomId}</span>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Players ({lobbyPlayers.length})</h3>
            <div className="space-y-2">
              {lobbyPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{index + 1}.</span>
                    <span className="text-white font-medium">
                      {getDisplayName(player, index)}
                    </span>
                    {player.isHost && (
                      <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded">HOST</span>
                    )}
                  </div>
                  <span className="text-green-400 text-sm">● Waiting</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Share the room ID with friends to invite them.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleStartGame}
              disabled={!isHost}
              className={`flex-1 font-bold py-3 px-6 rounded-lg transition-colors ${
                isHost 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              🎮 Start Game
            </button>
            
            <button 
              onClick={onLeave}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>
          
          {!isHost && (
            <p className="text-gray-500 text-sm mt-3 text-center">
              Waiting for the host to start the game...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
