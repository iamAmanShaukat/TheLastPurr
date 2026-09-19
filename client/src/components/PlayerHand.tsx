import { motion } from 'framer-motion';
import { ICard } from '../types/game';
import { Card } from './Card';

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
      className="flex flex-wrap justify-center gap-4 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {cards.map((card, index) => (
        <motion.div 
          key={card.id} 
          initial={{ opacity: 0, y: 20, rotate: -5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={!disabledCards.includes(card.id) && isMyTurn ? { y: -24, scale: 1.1, zIndex: 10 } : {}}
          className="transform transition-all duration-200"
        >
          <Card 
            card={card}
            onClick={() => !disabledCards.includes(card.id) && isMyTurn && onCardClick?.(card)}
            disabled={disabledCards.includes(card.id) || !isMyTurn}
            size="large"
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
