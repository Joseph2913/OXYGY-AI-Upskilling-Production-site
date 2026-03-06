import { useState, useRef, useCallback } from 'react';
import type { DashboardBrief, NewPRDResult } from '../types';
import { fetchWithRetry, getErrorMessage } from '../lib/fetchWithRetry';

export interface DashboardImageResult {
  image_url: string;
  image_prompt: string;
  html_content?: string;
  use_fallback?: boolean;
  generation_method?: 'gemini-image' | 'imagen' | 'html';
}

export interface PRDResult {
  prd_content: string;
  sections: Record<string, string>;
}

interface DashboardDesignPayload {
  user_needs: string;
  target_audience?: string;
  key_metrics?: string;
  data_sources?: string;
  dashboard_type?: string;
  visual_style?: string;
  inspiration_url?: string;
  refinement_feedback?: string;
  previous_prompt?: string;
  inspiration_images?: string[];
}

interface PRDPayload {
  user_needs: string;
  image_prompt: string;
  target_audience?: string;
  key_metrics?: string;
  data_sources?: string;
  dashboard_type?: string;
  visual_style?: string;
}

export const MAX_REGENERATIONS = 5;
export const MAX_PRD_GENERATIONS = 3;

export function useDashboardDesignApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPrdLoading, setIsPrdLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [prdGenerationCount, setPrdGenerationCount] = useState(0);
  const lastCallRef = useRef(0);

  const buildPayload = useCallback((
    brief: DashboardBrief,
    feedback?: string,
    previousPrompt?: string,
    inspirationImages?: string[],
  ): DashboardDesignPayload => ({
    user_needs: brief.q1_purpose,
    target_audience: brief.q2_audience || undefined,
    key_metrics: brief.q4_metrics || undefined,
    data_sources: brief.q5_dataSources.join(', ') || undefined,
    dashboard_type: brief.q3_type || undefined,
    visual_style: brief.q7_visualStyle || undefined,
    inspiration_url: brief.q9_inspirationUrls[0] || undefined,
    refinement_feedback: feedback || undefined,
    previous_prompt: previousPrompt || undefined,
    inspiration_images: inspirationImages && inspirationImages.length > 0 ? inspirationImages : undefined,
  }), []);

  const generateDashboardImage = useCallback(async (
    brief: DashboardBrief,
    feedback?: string,
    previousPrompt?: string,
    inspirationImages?: string[],
  ): Promise<DashboardImageResult | null> => {
    const now = Date.now();
    if (now - lastCallRef.current < 3000) {
      setError('Please wait a few seconds before trying again.');
      return null;
    }
    lastCallRef.current = now;

    if (regenerationCount >= MAX_REGENERATIONS) {
      setError(`You've reached the maximum of ${MAX_REGENERATIONS} generations for this session.`);
      return null;
    }

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    // Longer timeout for feedback refinement or inspiration analysis (extra API calls)
    const hasExtraSteps = feedback || (inspirationImages && inspirationImages.length > 0);
    const timeoutMs = hasExtraSteps ? 90000 : 60000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const payload = buildPayload(brief, feedback, previousPrompt, inspirationImages);
      const res = await fetchWithRetry('/api/design-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Dashboard API error:', res.status, errData);
        if (errData.error === 'API key not configured') {
          setError('OpenRouter API key not configured. Please add OpenRouter_API to .env.local and restart the server.');
        } else {
          setError(getErrorMessage(res.status, 'dashboard design'));
        }
        return null;
      }

      const data: DashboardImageResult = await res.json();

      setRegenerationCount(prev => prev + 1);
      return data;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('This is taking longer than expected. Please try again.');
      } else {
        setError('Unable to reach the dashboard design service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [regenerationCount, buildPayload]);

  const generatePRD = useCallback(async (
    brief: DashboardBrief,
    imagePrompt: string
  ): Promise<PRDResult | null> => {
    if (prdGenerationCount >= MAX_PRD_GENERATIONS) {
      setError(`You've reached the maximum of ${MAX_PRD_GENERATIONS} PRD generations.`);
      return null;
    }

    setIsPrdLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const payload: PRDPayload = {
        user_needs: brief.q1_purpose,
        image_prompt: imagePrompt,
        target_audience: brief.q2_audience || undefined,
        key_metrics: brief.q4_metrics || undefined,
        data_sources: brief.q5_dataSources.join(', ') || undefined,
        dashboard_type: brief.q3_type || undefined,
        visual_style: brief.q7_visualStyle || undefined,
      };

      const res = await fetchWithRetry('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('PRD API error:', res.status, errData);
        if (errData.error === 'API key not configured') {
          setError('OpenRouter API key not configured. Please add OpenRouter_API to .env.local and restart the server.');
        } else {
          setError(getErrorMessage(res.status, 'PRD generation'));
        }
        return null;
      }

      const data: PRDResult = await res.json();
      setPrdGenerationCount(prev => prev + 1);
      return data;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('PRD generation timed out. Please try again.');
      } else {
        setError('Unable to reach the PRD service. Please check your connection and try again.');
      }
      return null;
    } finally {
      setIsPrdLoading(false);
    }
  }, [prdGenerationCount]);

  const clearError = useCallback(() => setError(null), []);
  const resetCounts = useCallback(() => {
    setRegenerationCount(0);
    setPrdGenerationCount(0);
  }, []);

  return {
    generateDashboardImage, generatePRD,
    isLoading, isPrdLoading, error, clearError,
    regenerationCount, prdGenerationCount, resetCounts,
  };
}
