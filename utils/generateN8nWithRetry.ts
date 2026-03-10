/**
 * AI-powered n8n JSON generation with validation retry loop.
 *
 * Primary export path (Option A): Calls the API to generate n8n JSON via Claude,
 * validates client-side, retries up to 3 times with error feedback, then falls
 * back to the deterministic template assembler if all retries fail.
 */

import type { WorkflowIntermediate } from '../types';
import { validateN8nWorkflow, extractJson } from './validateN8nWorkflow';
import { assembleN8nWorkflow } from './assembleN8nWorkflow';

const MAX_AI_ATTEMPTS = 3;

export type GenerationMethod = 'ai' | 'template-fallback';

export interface GenerationResult {
  json: string;
  method: GenerationMethod;
}

/**
 * Call the server endpoint for AI n8n JSON generation.
 */
async function callGenerateApi(
  intermediate: WorkflowIntermediate,
  attempt: number,
  previousJson?: string,
  previousErrors?: string[],
): Promise<string> {
  const response = await fetch('/api/generate-n8n-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intermediate,
      attempt,
      previousJson,
      previousErrors,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.json || '';
}

/**
 * Generate n8n workflow JSON using AI (primary) with template fallback.
 *
 * Flow:
 * 1. Call Claude API to generate full n8n JSON
 * 2. Validate the result client-side
 * 3. If invalid, retry up to 3 times with errors fed back
 * 4. If all retries fail, fall back to deterministic template assembler
 *
 * @param onStatusUpdate - Optional callback for progress messages
 */
export async function generateN8nWithRetry(
  intermediate: WorkflowIntermediate,
  onStatusUpdate?: (msg: string, attempt: number) => void,
): Promise<GenerationResult> {
  let lastJson = '';
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_AI_ATTEMPTS; attempt++) {
    try {
      onStatusUpdate?.(
        attempt === 1
          ? 'Generating n8n workflow with AI...'
          : `Fixing validation errors (attempt ${attempt}/${MAX_AI_ATTEMPTS})...`,
        attempt,
      );

      const rawJson = await callGenerateApi(
        intermediate,
        attempt,
        attempt > 1 ? lastJson : undefined,
        attempt > 1 ? lastErrors : undefined,
      );

      const cleaned = extractJson(rawJson);
      const result = validateN8nWorkflow(cleaned);

      if (result.valid) {
        onStatusUpdate?.('Validation passed!', attempt);
        return { json: cleaned, method: 'ai' };
      }

      // Validation failed — store for retry
      lastJson = cleaned;
      lastErrors = result.errors;
      console.warn(`[n8n-gen] Attempt ${attempt} failed validation:`, result.errors);
    } catch (err) {
      console.warn(`[n8n-gen] Attempt ${attempt} threw error:`, err);
      lastErrors = [(err as Error).message || 'Unknown API error'];
    }
  }

  // All AI attempts failed — use deterministic fallback
  console.warn('[n8n-gen] AI generation failed after 3 attempts. Using template fallback.');
  onStatusUpdate?.('Using template assembler...', MAX_AI_ATTEMPTS + 1);

  const fallbackJson = assembleN8nWorkflow(intermediate);
  return { json: fallbackJson, method: 'template-fallback' };
}
