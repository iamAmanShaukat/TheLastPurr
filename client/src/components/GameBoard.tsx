import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerHand } from './PlayerHand';
import { Deck } from './Deck';
import { ICard } from '../types/game';

export const GameBoard: React.FC = () => {
  const { gameState, playerId, playCard, drawCard, endTurn } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);

  if (!gameState || !playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Connecting to game...</div>
      </div>
    );
  }

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.currentPlayerId === playerId;
  const isDefusing = gameState.phase === 'DEFUSE_PENDING' && myPlayer?.id === gameState.currentPlayerId;

  const handleCardClick = (card: ICard) => {
    if (!isMyTurn && !isDefusing) return;
    
    if (card.type === 'Nope') {
      // Play Nope immediately
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4">
        <h1 className="text-3xl font-bold text-white text-center mb-2">🐱 The Last Purr 🐱</h1>
        <div className="flex justify-between items-center bg-white/10 rounded-lg p-3">
          <div className="text-white">
            <span className="font-semibold">Room:</span> {gameState.status}
          </div>
          <div className="text-white">
            {isMyTurn ? (
              <span className="text-green-400 font-bold animate-pulse">Your Turn!</span>
            ) : (
              <span className="text-gray-400">Waiting for {gameState.currentPlayerId === playerId ? 'you' : 'other player'}...</span>
            )}
          </div>
          <div className="text-white">
            <span className="font-semibold">Phase:</span> {gameState.phase}
          </div>
        </div>
      </div>

      {/* Action Stack (Nopes) */}
      {gameState.actionStack.length > 0 && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-3">
            <h3 className="text-white font-bold mb-2">⚡ Action Stack (Respond with Nope!)</h3>
            <div className="flex gap-2 overflow-x-auto">
              {gameState.actionStack.map((item, idx) => (
                <div key={idx} className="bg-gray-800 rounded px-3 py-2 text-white text-sm whitespace-nowrap">
                  {item.action} by Player {item.playerId.slice(0, 4)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Other Players */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="text-xl font-bold text-white">Other Players</h2>
          {gameState.players.filter(p => p.id !== playerId).map(player => (
            <div key={player.id} className="bg-white/10 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold ${player.isAlive ? 'text-green-400' : 'text-red-400 line-through'}`}>
                  {player.name} {player.isAlive ? '🟢' : '💀'}
                </span>
                <span className="text-white text-sm">{player.hand.length} cards</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(player.hand.length, 10) }).map((_, idx) => (
                  <div key={idx} className="w-8 h-12 bg-indigo-600 rounded border border-indigo-800" />
                ))}
                {player.hand.length > 10 && (
                  <div className="w-8 h-12 flex items-center justify-center text-white text-xs">+{player.hand.length - 10}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Deck & Controls */}
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-4">Draw Deck</h2>
            <Deck 
              count={gameState.deckCount} 
              onDraw={handleDrawCard}
              disabled={!isMyTurn || gameState.phase !== 'DRAW'}
            />
          </div>

          {/* Action Buttons */}
          {isMyTurn && gameState.phase === 'MAIN' && (
            <div className="bg-white/10 rounded-lg p-4">
              <button
                onClick={handleEndTurn}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                End Turn (Draw Card)
              </button>
            </div>
          )}

          {selectedCard && (
            <div className="bg-yellow-600/50 rounded-lg p-4">
              <p className="text-white mb-2">Playing: {selectedCard.type}</p>
              <div className="flex gap-2">
                <button
                  onClick={handlePlaySelectedCard}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Hand */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 rounded-lg p-4">
          <h2 className="text-xl font-bold text-white mb-2">Your Hand ({myPlayer?.hand.length || 0} cards)</h2>
          <PlayerHand
            cards={myPlayer?.hand || []}
            onCardClick={handleCardClick}
            isMyTurn={isMyTurn || isDefusing}
          />
        </div>
      </div>

      {/* Game Over */}
      {gameState.status === 'GAME_OVER' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-lg p-8 text-center max-w-md mx-4">
            <h2 className="text-4xl font-bold text-white mb-4">
              {gameState.winnerId === playerId ? '🎉 YOU WIN! 🎉' : '💀 Game Over 💀'}
            </h2>
            <p className="text-xl text-white mb-6">
              {gameState.winnerId === playerId 
                ? 'You are the last purr standing!' 
                : 'Better luck next time!'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};