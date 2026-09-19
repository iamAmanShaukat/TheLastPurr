import { motion } from 'framer-motion';
import { ICard } from '../types/game';

interface CardProps {
  card: ICard;
  onClick?: () => void;
  disabled?: boolean;
  isHidden?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  disabled = false, 
  isHidden = false,
  size = 'large'
}) => {
  const sizeClasses = {
    small: 'w-20 h-28 text-xs',
    medium: 'w-32 h-44 text-sm',
    large: 'w-48 h-64 text-base',
  };

  const getCardColor = (type: string) => {
    const colors: Record<string, string> = {
      'Exploding Kitten': 'from-red-500 to-red-700 border-red-400',
      'Defuse': 'from-green-500 to-emerald-700 border-green-400',
      'Attack': 'from-orange-500 to-amber-700 border-orange-400',
      'Skip': 'from-blue-500 to-cyan-700 border-blue-400',
      'See the Future': 'from-purple-500 to-violet-700 border-purple-400',
      'Shuffle': 'from-yellow-500 to-amber-600 border-yellow-400',
      'Favor': 'from-pink-500 to-rose-700 border-pink-400',
      'Nope': 'from-gray-700 to-gray-900 border-gray-600',
    };
    return colors[type] || 'from-indigo-500 to-purple-700 border-indigo-400';
  };

  if (isHidden) {
    return (
      <motion.div 
        whileHover={{ scale: 1.05, rotateY: 180 }}
        className={`${sizeClasses[size]} bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl border-2 border-indigo-400 shadow-lg flex items-center justify-center cursor-pointer`}
      >
        <div className="text-white font-bold text-2xl">🎴</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={!disabled ? onClick : undefined}
      whileHover={!disabled ? { y: -12, scale: 1.05, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.3)' } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`
        ${sizeClasses[size]} 
        bg-gradient-to-br ${getCardColor(card.type)}
        rounded-xl border-2 shadow-lg 
        flex flex-col items-center justify-center p-4
        ${!disabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
        transition-all duration-200
        select-none
      `}
    >
      {/* Card Header - Type Name */}
      <div className="w-full bg-black/30 rounded-lg px-3 py-2 mb-3">
        <div className="font-bold text-center leading-tight text-white drop-shadow-lg text-lg">
          {card.type}
        </div>
      </div>
      
      {/* Card Center - Image Placeholder Area */}
      <div className="flex-1 w-full bg-white/10 rounded-lg flex items-center justify-center mb-3">
        <div className="text-6xl">
          {card.metadata.icon || '🃏'}
        </div>
      </div>
      
      {/* Card Bottom - Description */}
      {card.metadata.description && (
        <div className="w-full bg-black/30 rounded-lg px-3 py-2">
          <div className="text-xs opacity-90 text-center text-white/90 drop-shadow leading-tight">
            {card.metadata.description}
          </div>
        </div>
      )}
    </motion.div>
  );
};
