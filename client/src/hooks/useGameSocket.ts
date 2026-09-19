import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameSocket() {
  const { disconnect, isConnected, error } = useGameStore();

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, error };
}