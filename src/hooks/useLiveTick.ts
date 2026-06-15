import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

export function useLiveTick(startTimestamp: number | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTimestamp) {
      setElapsed(0);
      return;
    }

    const tick = () => setElapsed(Math.floor((Date.now() - startTimestamp) / 1000));

    tick(); // immediate — no 1-second delay on first render

    const interval = setInterval(tick, 1000);

    const appStateSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') tick(); // re-sync after background throttling
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [startTimestamp]);

  return elapsed;
}
