import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Users, Crown, LogOut, Play } from 'lucide-react';

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

  const getDisplayName = (player: any, index: number) => {
    if (player.id === playerId) {
      return `${playerName || 'You'}${isHost ? ' (Host)' : ''}`;
    }
    return player.name || `Player ${index + 1}`;
  };

  return (
    <div className="animated-bg min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <span className="text-6xl">🐱</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mt-4 mb-2">The Last Purr</h1>
          <p className="text-purple-300">Multiplayer Card Game Engine</p>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">Lobby</h2>
            </div>
            <span className="text-purple-300 bg-purple-500/20 px-4 py-2 rounded-xl">Room: {roomId}</span>
          </div>
          
          <div className="glass-dark rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-medium text-purple-200 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players ({lobbyPlayers.length})
            </h3>
            <div className="space-y-3">
              {lobbyPlayers.map((player, index) => (
                <motion.div 
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between glass rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400 font-mono">{index + 1}.</span>
                    <span className="text-white font-medium">
                      {getDisplayName(player, index)}
                    </span>
                    {player.isHost && (
                      <span className="text-xs bg-gradient-to-r from-yellow-600 to-amber-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" /> HOST
                      </span>
                    )}
                    {player.id === playerId && (
                      <span className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-green-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Waiting
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="text-purple-400/60 text-sm mt-4 text-center">
              Share the room ID with friends to invite them.
            </p>
          </div>
          
          <div className="flex gap-4">
            <motion.button 
              onClick={handleStartGame}
              disabled={!isHost}
              whileHover={{ scale: isHost ? 1.02 : 1 }}
              whileTap={{ scale: isHost ? 0.98 : 1 }}
              className={`flex-1 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 ${
                isHost 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-green-500/25' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5" />
              Start Game
            </motion.button>
            
            <motion.button 
              onClick={onLeave}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-red-500/25 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Leave
            </motion.button>
          </div>
          
          {!isHost && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-purple-400/60 text-sm mt-4 text-center"
            >
              Waiting for the host to start the game...
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
