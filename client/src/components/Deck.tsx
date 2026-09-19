import { motion } from 'framer-motion';

interface DeckProps {
  count: number;
  onDraw?: () => void;
  disabled?: boolean;
}

export const Deck: React.FC<DeckProps> = ({ count, onDraw, disabled = false }) => {
  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        onClick={!disabled ? onDraw : undefined}
        whileHover={!disabled ? { scale: 1.05, y: -5 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        className={`
          w-24 h-36 md:w-32 md:h-48 
          rounded-xl border-4 shadow-xl
          flex flex-col items-center justify-center
          transition-all duration-200
          ${disabled 
            ? 'bg-gray-600 border-gray-700 cursor-not-allowed opacity-50' 
            : 'bg-gradient-to-br from-indigo-600 to-purple-700 border-indigo-400 cursor-pointer glow-purple'
          }
        `}
      >
        <motion.div 
          className="text-white font-bold text-3xl mb-2"
          animate={!disabled ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          🎴
        </motion.div>
        <div className="text-white font-bold text-lg">{count}</div>
        <div className="text-white text-xs opacity-80">cards</div>
      </motion.div>
      {!disabled && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-white text-sm font-semibold bg-purple-500/20 px-3 py-1 rounded-full"
        >
          Draw Card
        </motion.div>
      )}
    </motion.div>
  );
};
