import { supabase } from './supabase';

/**
 * Check if a feature flag is enabled.
 * Org-specific overrides take precedence over global flags.
 */
export async function isFeatureEnabled(key: string, orgId?: string): Promise<boolean> {
  // 1. Check org-specific override first
  if (orgId) {
    const { data: orgFlag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .eq('org_id', orgId)
      .maybeSingle();
    if (orgFlag) return orgFlag.enabled;
  }

  // 2. Fall back to global flag
  const { data: globalFlag } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', key)
    .is('org_id', null)
    .maybeSingle();

  return globalFlag?.enabled ?? false;
}
