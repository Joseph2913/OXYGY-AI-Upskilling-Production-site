import type { PathwayApiResponse } from '../types';
import type { ToolkitProjectChip } from './database';

/**
 * Generates project-specific toolkit chips by calling the Cloud Function.
 * All AI logic runs server-side via OpenRouter — never directly from the browser.
 */
export async function generateProjectChips(
  plan: PathwayApiResponse
): Promise<Omit<ToolkitProjectChip, 'id' | 'userId' | 'generatedAt'>[]> {
  try {
    const response = await fetch('/api/generate-project-chips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levels: plan.levels }),
    });

    if (!response.ok) {
      console.error('generateProjectChips API error:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.chips || []) as Omit<ToolkitProjectChip, 'id' | 'userId' | 'generatedAt'>[];
  } catch (err) {
    console.error('generateProjectChips error:', err);
    return [];
  }
}
