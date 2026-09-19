import React from 'react';
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
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-16 h-24 text-xs',
    medium: 'w-24 h-36 text-sm',
    large: 'w-32 h-48 text-base',
  };

  const getCardColor = (type: string) => {
    const colors: Record<string, string> = {
      'Exploding Kitten': 'bg-red-500 border-red-700',
      'Defuse': 'bg-green-500 border-green-700',
      'Attack': 'bg-orange-500 border-orange-700',
      'Skip': 'bg-blue-500 border-blue-700',
      'See the Future': 'bg-purple-500 border-purple-700',
      'Shuffle': 'bg-yellow-500 border-yellow-700',
      'Favor': 'bg-pink-500 border-pink-700',
      'Nope': 'bg-gray-800 border-gray-900',
    };
    return colors[type] || 'bg-indigo-500 border-indigo-700';
  };

  if (isHidden) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg border-2 border-indigo-800 shadow-lg flex items-center justify-center`}>
        <div className="text-white font-bold text-2xl">🎴</div>
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        ${sizeClasses[size]} 
        ${getCardColor(card.type)}
        rounded-lg border-2 shadow-lg 
        flex flex-col items-center justify-center p-2
        cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        select-none
      `}
    >
      <div className="font-bold text-center leading-tight mb-1">
        {card.type}
      </div>
      {card.metadata.description && (
        <div className="text-xs opacity-80 text-center hidden md:block">
          {card.metadata.description}
        </div>
      )}
      <div className="mt-auto text-lg">
        {card.metadata.icon || '🃏'}
      </div>
    </div>
  );
};