import { useState, useRef, useCallback } from 'react';
import type { PlaygroundResult } from '../types';
import { fetchWithRetry, getErrorMessage } from '../lib/fetchWithRetry';

export function usePlaygroundApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCallRef = useRef(0);

  const generate = useCallback(async (userInput: string): Promise<PlaygroundResult | null> => {
    // Rate limit: 1 request per 5 seconds (PRD Section 9.6)
    const now = Date.now();
    if (now - lastCallRef.current < 5000) {
      setError('Please wait a few seconds before trying again.');
      return null;
    }
    lastCallRef.current = now;

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetchWithRetry('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        setError(getErrorMessage(res.status, 'prompt generation'));
        return null;
      }

      const data: PlaygroundResult = await res.json();

      // Validate response structure
      if (
        typeof data.prompt !== 'string' ||
        !data.prompt.length ||
        !Array.isArray(data.strategies_used) ||
        data.strategies_used.length < 1
      ) {
        setError('Something went wrong generating your prompt. Please try again.');
        return null;
      }

      return data;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('This is taking longer than expected. Please try again.');
      } else {
        setError('Unable to reach the prompt service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { generate, isLoading, error, clearError };
}
