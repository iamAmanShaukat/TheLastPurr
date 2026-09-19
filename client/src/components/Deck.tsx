import React from 'react';

interface DeckProps {
  count: number;
  onDraw?: () => void;
  disabled?: boolean;
}

export const Deck: React.FC<DeckProps> = ({ count, onDraw, disabled = false }) => {
  return (
    <div className="flex flex-col items-center">
      <div
        onClick={!disabled ? onDraw : undefined}
        className={`
          w-24 h-36 md:w-32 md:h-48 
          rounded-lg border-4 shadow-xl
          flex flex-col items-center justify-center
          transition-all duration-200
          ${disabled 
            ? 'bg-gray-600 border-gray-700 cursor-not-allowed opacity-50' 
            : 'bg-gradient-to-br from-indigo-600 to-purple-700 border-indigo-800 cursor-pointer hover:scale-105 hover:shadow-2xl'
          }
        `}
      >
        <div className="text-white font-bold text-3xl mb-2">🎴</div>
        <div className="text-white font-bold text-lg">{count}</div>
        <div className="text-white text-xs opacity-80">cards</div>
      </div>
      {!disabled && (
        <div className="mt-2 text-white text-sm font-semibold">
          Draw Card
        </div>
      )}
    </div>
  );
};