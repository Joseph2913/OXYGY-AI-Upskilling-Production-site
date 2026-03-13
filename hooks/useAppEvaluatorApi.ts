import { useState, useRef } from 'react';
import type { AppEvaluatorInputs, AppEvaluatorResult, AppBuildPlanInputs, AppBuildPlanResult } from '../types';
import { fetchWithRetry, getErrorMessage } from '../lib/fetchWithRetry';

export function useAppEvaluatorApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [isBuildPlanLoading, setIsBuildPlanLoading] = useState(false);
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

      // Validate response structure (matrix_placement and architecture required; implementation_plan moved to build plan)
      if (
        !data.design_score ||
        !data.architecture ||
        !data.risks_and_gaps ||
        typeof data.design_score.overall_score !== 'number' ||
        !Array.isArray(data.architecture.components) ||
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

  const generateBuildPlan = async (payload: AppBuildPlanInputs): Promise<AppBuildPlanResult | null> => {
    const now = Date.now();
    if (now - lastCallRef.current < 8000) {
      setError('Please wait a few seconds before trying again.');
      return null;
    }

    setIsBuildPlanLoading(true);
    setError(null);
    lastCallRef.current = now;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // longer timeout for build plan

    try {
      const res = await fetchWithRetry('/api/evaluate-app-build-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        setError(getErrorMessage(res.status, 'build plan generation'));
        return null;
      }

      const data = await res.json();

      // Validate response structure
      if (
        !data.build_plan_summary ||
        !Array.isArray(data.implementation_phases) ||
        !Array.isArray(data.architecture_components) ||
        !Array.isArray(data.getting_started)
      ) {
        setError('Received an unexpected response format. Please try again.');
        return null;
      }

      return data as AppBuildPlanResult;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('This is taking longer than expected. Please try again.');
      } else {
        setError('Unable to reach the build plan service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setIsBuildPlanLoading(false);
    }
  };

  return { evaluateApp, generateBuildPlan, isLoading, isBuildPlanLoading, error, clearError };
}
