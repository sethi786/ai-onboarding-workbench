'use client';

import { useRef, useState, useTransition } from 'react';

/** Keep a failed save visible and await the action before claiming success. */
export function useGovernanceSave() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  function save(action: () => Promise<{ error?: string }>, onSuccess?: () => void) {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) setError(result.error);
        else onSuccess?.();
      } catch {
        setError('Could not save. Check your connection and retry.');
      } finally {
        busy.current = false;
      }
    });
  }
  return { save, pending, error };
}
