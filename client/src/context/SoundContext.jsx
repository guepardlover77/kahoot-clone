import { createContext, useContext, useState, useCallback } from 'react';
import { useSound } from '../hooks/useSound';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  const [isMuted, setIsMuted] = useState(false);
  const sounds = useSound();

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newValue = !prev;
      sounds.setEnabled(!newValue);
      return newValue;
    });
  }, [sounds]);

  const value = {
    ...sounds,
    isMuted,
    toggleMute,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
}
