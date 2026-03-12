import { useState, useRef } from 'react';
import type { AgentDesignResult, AgentSetupGuide } from '../types';
import { fetchWithRetry, getErrorMessage } from '../lib/fetchWithRetry';

interface AgentDesignPayload {
  task_description: string;
  input_data_description: string;
}

interface SetupGuidePayload {
  platform: string;
  system_prompt: string;
  output_format: { human_readable: string; json_template: Record<string, unknown> };
  task_description: string;
}

export function useAgentDesignApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCallRef = useRef(0);

  const clearError = () => setError(null);

  const designAgent = async (payload: AgentDesignPayload): Promise<AgentDesignResult | null> => {
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
      const res = await fetchWithRetry('/api/design-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        setError(getErrorMessage(res.status, 'agent design'));
        return null;
      }

      const data = await res.json();

      // Validate response structure
      if (
        !data.readiness ||
        !data.output_format ||
        !data.system_prompt ||
        !data.accountability ||
        typeof data.readiness.overall_score !== 'number' ||
        !Array.isArray(data.accountability)
      ) {
        setError('Received an unexpected response format. Please try again.');
        return null;
      }

      return data as AgentDesignResult;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('This is taking longer than expected. Please try again.');
      } else {
        setError('Unable to reach the agent design service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateSetupGuide = async (payload: SetupGuidePayload): Promise<AgentSetupGuide | null> => {
    const now = Date.now();
    if (now - lastCallRef.current < 8000) {
      setError('Please wait a few seconds before trying again.');
      return null;
    }

    setSetupLoading(true);
    setError(null);
    lastCallRef.current = now;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetchWithRetry('/api/agent-setup-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        setError(getErrorMessage(res.status, 'setup guide'));
        return null;
      }

      const data = await res.json();

      if (!Array.isArray(data.steps) || !Array.isArray(data.tips)) {
        setError('Received an unexpected response format. Please try again.');
        return null;
      }

      return data as AgentSetupGuide;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('This is taking longer than expected. Please try again.');
      } else {
        setError('Unable to reach the setup guide service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setSetupLoading(false);
    }
  };

  return { designAgent, generateSetupGuide, isLoading, setupLoading, error, clearError };
}
