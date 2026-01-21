import { useCallback, useRef } from 'react';

// Create an AudioContext singleton
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

export function useSound() {
  const isEnabledRef = useRef(true);

  const playTone = useCallback((frequency, duration, type = 'sine', volume = 0.3) => {
    if (!isEnabledRef.current) return;

    try {
      const ctx = getAudioContext();

      // Resume context if suspended (required for autoplay policies)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, []);

  const playCorrect = useCallback(() => {
    // Happy ascending chord
    playTone(523.25, 0.15, 'sine', 0.2); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.3, 'sine', 0.25), 200); // G5
  }, [playTone]);

  const playWrong = useCallback(() => {
    // Descending buzz
    playTone(200, 0.15, 'sawtooth', 0.15);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.1), 100);
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(800, 0.05, 'sine', 0.1);
  }, [playTone]);

  const playCountdown = useCallback(() => {
    playTone(440, 0.2, 'sine', 0.15); // A4
  }, [playTone]);

  const playGameStart = useCallback(() => {
    // Exciting ascending melody
    playTone(262, 0.1, 'sine', 0.2); // C4
    setTimeout(() => playTone(330, 0.1, 'sine', 0.2), 100); // E4
    setTimeout(() => playTone(392, 0.1, 'sine', 0.2), 200); // G4
    setTimeout(() => playTone(523, 0.3, 'sine', 0.25), 300); // C5
  }, [playTone]);

  const playTimeWarning = useCallback(() => {
    // Urgent beep
    playTone(880, 0.1, 'square', 0.1);
  }, [playTone]);

  const playVictory = useCallback(() => {
    // Triumphant fanfare
    const notes = [
      { freq: 523.25, delay: 0 },    // C5
      { freq: 659.25, delay: 150 },  // E5
      { freq: 783.99, delay: 300 },  // G5
      { freq: 1046.5, delay: 450 },  // C6
      { freq: 783.99, delay: 600 },  // G5
      { freq: 1046.5, delay: 750 },  // C6
    ];

    notes.forEach(({ freq, delay }) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), delay);
    });
  }, [playTone]);

  const playPlayerJoin = useCallback(() => {
    // Friendly pop
    playTone(600, 0.08, 'sine', 0.15);
    setTimeout(() => playTone(800, 0.08, 'sine', 0.15), 50);
  }, [playTone]);

  const playStreak = useCallback((streakCount) => {
    // Higher pitch for longer streaks
    const baseFreq = 400 + (streakCount * 50);
    playTone(baseFreq, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(baseFreq * 1.25, 0.1, 'sine', 0.15), 80);
    setTimeout(() => playTone(baseFreq * 1.5, 0.15, 'sine', 0.2), 160);
  }, [playTone]);

  const playTick = useCallback(() => {
    playTone(1000, 0.03, 'sine', 0.05);
  }, [playTone]);

  const setEnabled = useCallback((enabled) => {
    isEnabledRef.current = enabled;
  }, []);

  return {
    playCorrect,
    playWrong,
    playClick,
    playCountdown,
    playGameStart,
    playTimeWarning,
    playVictory,
    playPlayerJoin,
    playStreak,
    playTick,
    setEnabled,
  };
}
