import React from 'react';
import { ICard } from '../types/game';

interface PlayerHandProps {
  cards: ICard[];
  onCardClick?: (card: ICard) => void;
  disabledCards?: string[];
  isMyTurn: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ 
  cards, 
  onCardClick, 
  disabledCards = [],
  isMyTurn 
}) => {
  if (!cards || cards.length === 0) {
    return (
      <div className="text-white text-lg">No cards in hand</div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 p-4">
      {cards.map((card) => (
        <div key={card.id} className="transform hover:-translate-y-2 transition-transform">
          <div
            onClick={() => onCardClick?.(card)}
            className={`
              w-20 h-28 md:w-24 md:h-36 
              rounded-lg border-2 shadow-md
              flex flex-col items-center justify-center p-1 md:p-2
              cursor-pointer transition-all duration-200
              ${disabledCards.includes(card.id) || !isMyTurn
                ? 'opacity-50 cursor-not-allowed bg-gray-600 border-gray-700' 
                : 'bg-indigo-500 border-indigo-700 hover:scale-105 hover:shadow-xl'
              }
            `}
          >
            <div className="font-bold text-white text-xs md:text-sm text-center leading-tight">
              {card.type}
            </div>
            <div className="mt-auto text-lg">
              {card.metadata.icon || '🃏'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};