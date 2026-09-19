import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { GameBoard } from './components/GameBoard';
import { Lobby } from './components/Lobby';
import { Cat, Sparkles } from 'lucide-react';

function App() {
  const { isConnected, gameState, joinRoom, leaveRoom } = useGameStore();
  
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

  const handleLeave = () => {
    leaveRoom();
    setHasJoined(false);
    setPlayerName('');
    setRoomIdInput('');
  };

  // Show initial connection screen
  if (!isConnected) {
    return (
      <div className="animated-bg min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Cat className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">The Last Purr</h1>
          <p className="text-purple-300 mb-6">Multiplayer Card Game Engine</p>
          
          <motion.div 
            className="flex items-center justify-center gap-2 text-white"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
            <span>Connecting to server...</span>
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    );
  }
  
  // Show Lobby Screen (before game starts)
  if (!gameState && hasJoined) {
    return <Lobby onLeave={handleLeave} />;
  }
  
  if (!hasJoined) {
    return (
      <div className="animated-bg min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <Cat className="w-16 h-16 text-purple-400 mx-auto mb-3" />
            <h1 className="text-4xl font-bold text-white mb-2">The Last Purr</h1>
            <p className="text-purple-300">Multiplayer Card Game Engine</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-purple-200 mb-2 font-medium">Your Name</label>
              <input
                type="text"
                placeholder="e.g., Alice"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={12}
                className="w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-purple-200 mb-2 font-medium">Room ID</label>
              <input
                type="text"
                placeholder="e.g., room-123"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <p className="text-purple-400/60 text-sm mt-2">Enter an existing room ID or create a new one.</p>
            </div>

            <motion.button 
              onClick={handleJoin}
              disabled={!playerName.trim() || !roomIdInput.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
            >
              Join Game
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show Game Board
  return <GameBoard />;
}

export default App;
