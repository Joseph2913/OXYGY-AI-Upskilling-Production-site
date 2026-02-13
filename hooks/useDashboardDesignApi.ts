import { useState, useRef, useCallback } from 'react';

export interface DashboardImageResult {
  image_url: string;
  image_prompt: string;
  html_content?: string;
  use_fallback?: boolean;
}

export interface PRDResult {
  prd_content: string;
  sections: {
    title_and_author: string;
    purpose_and_scope: string;
    stakeholders: string;
    market_assessment: string;
    product_overview: string;
    functional_requirements: string;
    usability_requirements: string;
    technical_requirements: string;
    environmental_requirements: string;
    support_requirements: string;
    interaction_requirements: string;
    assumptions: string;
    constraints: string;
    dependencies: string;
    workflow_timeline: string;
    evaluation_metrics: string;
  };
}

interface DashboardDesignPayload {
  user_needs: string;
  target_audience?: string;
  key_metrics?: string;
  data_sources?: string;
  image_prompt?: string;
  dashboard_title?: string;
  dashboard_subtitle?: string;
  editable_metrics?: Array<{name: string; value: number; change: number}>;
}

interface PRDPayload {
  user_needs: string;
  image_prompt: string;
  target_audience?: string;
  key_metrics?: string;
  data_sources?: string;
}

export function useDashboardDesignApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCallRef = useRef(0);

  const generateDashboardImage = useCallback(async (
    payload: DashboardDesignPayload
  ): Promise<DashboardImageResult | null> => {
    // Rate limit: 1 request per 5 seconds
    const now = Date.now();
    if (now - lastCallRef.current < 5000) {
      setError('Please wait a few seconds before trying again.');
      return null;
    }
    lastCallRef.current = now;

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/design-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        
        // Check if API explicitly says to use fallback (quota exceeded)
        if (errData.use_fallback) {
          console.log('API requested fallback:', errData.error);
          return null; // Trigger fallback
        }
        
        const errorMsg = errData.error || `API error (status ${res.status})`;
        console.error('Dashboard API error:', errorMsg, errData);
        // Return null to trigger fallback
        return null;
      }

      const data: DashboardImageResult = await res.json();
      
      // Check if API returned fallback signal
      if (data.use_fallback) {
        return null; // Trigger fallback
      }
      
      return data;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        setError('This is taking longer than expected. Please try again.');
      } else {
        setError('Something went wrong generating your dashboard. Please try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePRD = useCallback(async (
    payload: PRDPayload
  ): Promise<PRDResult | null> => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // Reduced timeout

    try {
      const res = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 503) {
          setError('The PRD generation service is temporarily unavailable.');
        } else {
          setError('Something went wrong generating your PRD. Please try again.');
        }
        return null;
      }

      const data: PRDResult = await res.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        setError('PRD generation timed out. Using simplified version.');
        // Return a simple fallback PRD
        return {
          prd_content: `PRD for Dashboard - ${payload.target_audience || 'Business Users'}`,
          sections: {
            title_and_author: `Title: Dashboard\nAuthor: Product Team\nDate: ${new Date().toLocaleDateString()}\nVersion: 1.0`,
            purpose_and_scope: `Business Purpose: ${payload.user_needs || 'Provide visibility into key metrics.'}\n\nTechnical Scope: Web-based dashboard with data visualization capabilities.`,
            stakeholders: `Primary: ${payload.target_audience || 'Business users'}\nSecondary: IT/Data teams`,
            market_assessment: `Target: ${payload.target_audience || 'Business professionals'} requiring data insights.`,
            product_overview: `Dashboard displaying ${payload.key_metrics || 'key metrics'} for monitoring and decision-making.`,
            functional_requirements: 'Display metrics, charts, and data tables. Support filtering and export.',
            usability_requirements: 'Intuitive interface, responsive design, accessible components.',
            technical_requirements: 'Web-based (React/Next.js), secure API integration, modern browsers.',
            environmental_requirements: 'Cloud hosting, Node.js runtime, RESTful APIs.',
            support_requirements: 'Documentation, monitoring, user training.',
            interaction_requirements: `Integrates with ${payload.data_sources || 'data sources'} via APIs.`,
            assumptions: 'Data sources available, users authenticated, network stable.',
            constraints: 'Performance targets, browser compatibility, security compliance.',
            dependencies: 'Data APIs, authentication system, hosting infrastructure.',
            workflow_timeline: 'Design (Weeks 1-2), Development (Weeks 3-4), Testing (Week 5), Launch (Week 6).',
            evaluation_metrics: 'Performance: < 2s load time. Usability: > 4/5 satisfaction. Adoption: Daily active users.',
          },
        };
      } else {
        setError('Something went wrong generating your PRD. Please try again.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { generateDashboardImage, generatePRD, isLoading, error, clearError };
}
