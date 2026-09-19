import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { PlayerHand } from './PlayerHand';
import { Deck } from './Deck';
import { ICard } from '../types/game';
import { Zap, Users, Clock, Trophy } from 'lucide-react';

export const GameBoard: React.FC = () => {
  const { gameState, playerId, playCard, drawCard, endTurn } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  
  if (!gameState || !playerId) {
    return (
      <div className="animated-bg min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl glass rounded-2xl p-8">Connecting to game...</div>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.currentPlayerId === playerId;
  const isDefusing = gameState.phase === 'DEFUSE_PENDING' && myPlayer?.id === gameState.currentPlayerId;

  const handleCardClick = (card: ICard) => {
    if (!isMyTurn && !isDefusing) return;
    
    if (card.type === 'Nope') {
      playCard(card.id);
    } else {
      setSelectedCard(card);
    }
  };

  const handlePlaySelectedCard = () => {
    if (selectedCard) {
      playCard(selectedCard.id);
      setSelectedCard(null);
    }
  };

  const handleEndTurn = () => {
    if (isMyTurn && gameState.phase === 'MAIN') {
      endTurn();
    }
  };

  const handleDrawCard = () => {
    if (isMyTurn && gameState.phase === 'DRAW') {
      drawCard();
    }
  };

  return (
    <div className="animated-bg min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">🐱 The Last Purr 🐱</h1>
              <p className="text-purple-300 text-sm">Room: {gameState.status}</p>
            </div>
            
            <motion.div 
              className={`px-6 py-3 rounded-xl font-bold text-lg ${
                isMyTurn 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
              }`}
              animate={isMyTurn ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isMyTurn ? '✨ Your Turn!' : `Waiting for ${gameState.currentPlayerId === playerId ? 'you' : 'other player'}...`}
            </motion.div>
            
            <div className="flex items-center gap-2 text-purple-300">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Phase:</span> 
              <span className="bg-purple-500/20 px-3 py-1 rounded-lg">{gameState.phase}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Stack */}
      {gameState.actionStack.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <div className="glow-red bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-6 h-6 text-red-400" />
              <h3 className="text-white font-bold text-lg">Action Stack (Respond with Nope!)</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {gameState.actionStack.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-800/80 rounded-xl px-4 py-2 text-white text-sm whitespace-nowrap border border-gray-700"
                >
                  <span className="font-semibold text-red-400">{item.action}</span> by Player {item.playerId.slice(0, 4)}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Other Players */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-white mb-2">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold">Other Players</h2>
          </div>
          {gameState.players.filter(p => p.id !== playerId).map((player, idx) => (
            <motion.div 
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`font-bold text-lg ${player.isAlive ? 'text-green-400' : 'text-red-400 line-through'}`}>
                  {player.name} {player.isAlive ? '🟢' : '💀'}
                </span>
                <span className="text-white bg-purple-500/20 px-3 py-1 rounded-lg text-sm">
                  {player.hand.length} cards
                </span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: Math.min(player.hand.length, 15) }).map((_, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="w-10 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg border-2 border-indigo-800 shadow-md"
                  />
                ))}
                {player.hand.length > 15 && (
                  <div className="w-10 h-14 flex items-center justify-center text-white text-xs font-bold bg-purple-500/20 rounded-lg">
                    +{player.hand.length - 15}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Deck & Controls */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 flex flex-col items-center"
          >
            <h2 className="text-xl font-bold text-white mb-4">Draw Deck</h2>
            <Deck 
              count={gameState.deckCount} 
              onDraw={handleDrawCard}
              disabled={!isMyTurn || gameState.phase !== 'DRAW'}
            />
          </motion.div>

          {isMyTurn && gameState.phase === 'MAIN' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4"
            >
              <motion.button
                onClick={handleEndTurn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25"
              >
                End Turn (Draw Card)
              </motion.button>
            </motion.div>
          )}

          {selectedCard && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glow-purple bg-yellow-600/20 border border-yellow-500/50 rounded-2xl p-4 backdrop-blur-sm"
            >
              <p className="text-white mb-3 font-semibold">Playing: <span className="text-yellow-400">{selectedCard.type}</span></p>
              <div className="flex gap-2">
                <motion.button
                  onClick={handlePlaySelectedCard}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg"
                >
                  ✓ Confirm
                </motion.button>
                <motion.button
                  onClick={() => setSelectedCard(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg"
                >
                  ✕ Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* My Hand */}
      <div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            Your Hand 
            <span className="bg-purple-500/20 px-3 py-1 rounded-lg">{myPlayer?.hand.length || 0} cards</span>
          </h2>
          <PlayerHand
            cards={myPlayer?.hand || []}
            onCardClick={handleCardClick}
            isMyTurn={isMyTurn || isDefusing}
          />
        </motion.div>
      </div>
      </div>

      {/* Game Over */}
      {gameState.status === 'GAME_OVER' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="glass-dark rounded-3xl p-8 md:p-12 text-center max-w-md w-full border border-purple-500/30 glow-purple"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {gameState.winnerId === playerId ? '🎉 YOU WIN! 🎉' : '💀 Game Over 💀'}
            </h2>
            <p className="text-xl text-purple-200 mb-8">
              {gameState.winnerId === playerId 
                ? 'You are the last purr standing!' 
                : 'Better luck next time!'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-green-500/25"
            >
              Play Again
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
