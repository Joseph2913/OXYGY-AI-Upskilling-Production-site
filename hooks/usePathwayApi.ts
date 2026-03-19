import { useState, useRef } from 'react';
import type { PathwayFormData, PathwayApiResponse } from '../types';
import { fetchWithRetry, getErrorMessage } from '../lib/fetchWithRetry';

export function usePathwayApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCallRef = useRef(0);
  const lastErrorRef = useRef<string | null>(null);

  const clearError = () => { setError(null); lastErrorRef.current = null; };
  const setErrorSync = (msg: string) => { setError(msg); lastErrorRef.current = msg; };

  const generatePathway = async (
    formData: PathwayFormData,
    levelDepths: Record<string, string>,
  ): Promise<PathwayApiResponse | null> => {
    const now = Date.now();
    if (now - lastCallRef.current < 8000) {
      setErrorSync('Please wait a few seconds before trying again.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    lastCallRef.current = now;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetchWithRetry('/api/generate-pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, levelDepths }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        setErrorSync(getErrorMessage(res.status, 'pathway'));
        return null;
      }

      const data = await res.json();

      if (!data.pathwaySummary || !data.levels) {
        setErrorSync('Received an unexpected response format. Please try again.');
        return null;
      }

      return data as PathwayApiResponse;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorSync('This is taking longer than expected. The AI service may be under heavy load — please try again in a moment.');
      } else {
        setErrorSync('Unable to reach the pathway service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generatePathway, isLoading, error, clearError, lastErrorRef };
}
