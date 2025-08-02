// src/hooks/useBleCueListener.ts
import { useEffect, useRef } from 'react';

// Byt ut denna hook till riktig BLE senare!
export function useBleCueListener(
  cueCallback: (cueId: string) => void,
  enabled: boolean
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // MOCK: triggar cue-id 1, 2, 3 med 8 sek mellanrum
    const cues = ['1', '2', '3'];
    let idx = 0;
    timerRef.current = setInterval(() => {
      if (idx < cues.length) {
        cueCallback(cues[idx]);
        idx++;
      } else {
        clearInterval(timerRef.current!);
      }
    }, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, cueCallback]);
}
