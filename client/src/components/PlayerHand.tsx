import { motion } from 'framer-motion';
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
      <div className="text-white text-lg glass rounded-xl p-4 text-center">No cards in hand</div>
    );
  }

  return (
    <motion.div 
      className="flex flex-wrap justify-center gap-3 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {cards.map((card, index) => (
        <motion.div 
          key={card.id} 
          initial={{ opacity: 0, y: 20, rotate: -5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={!disabledCards.includes(card.id) && isMyTurn ? { y: -16, scale: 1.05, zIndex: 10 } : {}}
          className="transform transition-all duration-200"
        >
          <div
            onClick={() => !disabledCards.includes(card.id) && isMyTurn && onCardClick?.(card)}
            className={`
              w-20 h-28 md:w-24 md:h-36 
              rounded-xl border-2 shadow-md
              flex flex-col items-center justify-center p-1 md:p-2
              ${disabledCards.includes(card.id) || !isMyTurn
                ? 'opacity-50 cursor-not-allowed bg-gray-600/50 border-gray-700 backdrop-blur-sm' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 cursor-pointer hover:shadow-xl hover:border-purple-400'
              }
              transition-all duration-200
            `}
          >
            <div className="font-bold text-white text-xs md:text-sm text-center leading-tight drop-shadow-lg">
              {card.type}
            </div>
            <div className="mt-auto text-lg">
              {card.metadata.icon || '🃏'}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
