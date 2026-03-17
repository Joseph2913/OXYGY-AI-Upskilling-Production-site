// lib/enrollment.ts — Enrollment pipeline + utility functions (PRD-12)

import { supabase } from './supabase';
import type { EnrollmentChannel } from '../types';

// ── Code & Slug Generators ──

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes I, O, 0, 1

export function generateAccessCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

export function generateSlug(orgName: string): string {
  const base = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  const quarter = `q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  const year = new Date().getFullYear();
  return `${base}-${quarter}-${year}`;
}

// ── Channel Validation ──

export function getChannelStatus(channel: EnrollmentChannel): { label: string; color: string; bg: string } {
  if (!channel.active) return { label: 'Inactive', color: '#9B2C2C', bg: '#FED7D7' };
  if (channel.expiresAt && new Date(channel.expiresAt) < new Date())
    return { label: 'Expired', color: '#975A16', bg: '#FEFCBF' };
  if (channel.maxUses && channel.usesCount >= channel.maxUses)
    return { label: 'Maxed', color: '#975A16', bg: '#FEFCBF' };
  return { label: 'Active', color: '#22543D', bg: '#C6F6D5' };
}

export function isChannelUsable(channel: EnrollmentChannel): { usable: boolean; reason?: string } {
  if (!channel.active) return { usable: false, reason: 'This enrollment link is no longer active.' };
  if (channel.expiresAt && new Date(channel.expiresAt) < new Date())
    return { usable: false, reason: 'This enrollment link has expired.' };
  if (channel.maxUses && channel.usesCount >= channel.maxUses)
    return { usable: false, reason: 'This enrollment link has reached its limit.' };
  return { usable: true };
}

// ── Enrollment Pipeline ──

export async function enrollUser(
  userId: string,
  channel: EnrollmentChannel & { org_id?: string; cohort_id?: string | null; uses_count?: number; max_uses?: number | null; expires_at?: string | null },
): Promise<{ success: boolean; error?: string }> {
  // Normalise field names (camelCase from app types vs snake_case from raw DB)
  const orgId = channel.org_id || channel.orgId;
  const cohortId = channel.cohort_id ?? channel.cohortId ?? null;
  const usesCount = channel.uses_count ?? channel.usesCount ?? 0;
  const maxUses = channel.max_uses ?? channel.maxUses ?? null;
  const expiresAt = channel.expires_at ?? channel.expiresAt ?? null;

  // 1. Check if user is already a member of this org
  const { data: existing } = await supabase
    .from('user_org_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('active', true)
    .maybeSingle();

  if (existing) {
    return { success: true }; // Already enrolled — idempotent
  }

  // 2. Re-check channel constraints (race condition guard)
  if (maxUses && usesCount >= maxUses) {
    return { success: false, error: 'This enrollment link has reached its limit.' };
  }
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return { success: false, error: 'This enrollment link has expired.' };
  }

  // 3. Create membership
  const { error: membershipError } = await supabase
    .from('user_org_memberships')
    .insert({
      user_id: userId,
      org_id: orgId,
      role: 'learner',
      cohort_id: cohortId,
      enrolled_via: channel.id,
      active: true,
    });

  if (membershipError) {
    console.error('Enrollment failed:', membershipError);
    return { success: false, error: 'Enrollment failed. Please try again.' };
  }

  // 4. Increment channel uses_count
  await supabase
    .from('enrollment_channels')
    .update({ uses_count: usesCount + 1 })
    .eq('id', channel.id);

  return { success: true };
}

// ── Channel Lookup ──

export async function lookupLinkChannel(slug: string) {
  const { data, error } = await supabase
    .from('enrollment_channels')
    .select('*, organisations(name, branding)')
    .eq('value', slug)
    .eq('type', 'link')
    .maybeSingle();

  return { channel: data, error };
}

export async function lookupCodeChannel(code: string) {
  const { data, error } = await supabase
    .from('enrollment_channels')
    .select('*, organisations(name)')
    .eq('value', code.trim().toUpperCase())
    .eq('type', 'code')
    .eq('active', true)
    .maybeSingle();

  return { channel: data, error };
}

// ── Domain Auto-Assign ──

export async function checkDomainAutoEnroll(userId: string, email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const { data: domainChannel } = await supabase
    .from('enrollment_channels')
    .select('*')
    .eq('type', 'domain')
    .eq('value', domain)
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!domainChannel) return false;
  if (domainChannel.auto_enroll === false) return false;

  const result = await enrollUser(userId, domainChannel);
  return result.success;
}
