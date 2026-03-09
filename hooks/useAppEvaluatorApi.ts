import { useState, useRef } from 'react';
import type { AppEvaluatorInputs, AppEvaluatorResult } from '../types';
import { fetchWithRetry, getErrorMessage } from '../lib/fetchWithRetry';

export function useAppEvaluatorApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCallRef = useRef(0);

  const clearError = () => setError(null);

  const evaluateApp = async (payload: AppEvaluatorInputs): Promise<AppEvaluatorResult | null> => {
    // Rate limit: 1 request per 8 seconds
    const now = Date.now();
    if (now - lastCallRef.current < 8000) {
      setError('Please wait a few seconds before trying again.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    lastCallRef.current = now;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetchWithRetry('/api/evaluate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        setError(getErrorMessage(res.status, 'app evaluation'));
        return null;
      }

      const data = await res.json();

      // Validate response structure
      if (
        !data.design_score ||
        !data.architecture ||
        !data.implementation_plan ||
        !data.risks_and_gaps ||
        typeof data.design_score.overall_score !== 'number' ||
        !Array.isArray(data.architecture.components) ||
        !Array.isArray(data.implementation_plan.steps) ||
        !Array.isArray(data.risks_and_gaps.items)
      ) {
        setError('Received an unexpected response format. Please try again.');
        return null;
      }

      return data as AppEvaluatorResult;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('This is taking longer than expected. Please try again.');
      } else {
        setError('Unable to reach the app evaluation service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { evaluateApp, isLoading, error, clearError };
}