import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameSocket() {
  const { socket, isConnected, error, joinRoom, startGame, disconnect } = useGameStore();
  
  useEffect(() => {
    return () => {
      // Optional cleanup if needed
    };
  }, []);
  
  return { socket, isConnected, error, joinRoom, startGame, disconnect };
}
