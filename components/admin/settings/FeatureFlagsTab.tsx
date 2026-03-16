import React, { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import AdminCard from '../AdminCard';
import AdminSectionLabel from '../AdminSectionLabel';
import ToggleSwitch from './ToggleSwitch';
import AddOverrideModal from './AddOverrideModal';
import { supabase } from '../../../lib/supabase';
import { writeAuditLog } from '../../../lib/database';
import { useAuth } from '../../../context/AuthContext';

interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  org_id: string | null;
  enabled: boolean;
}

interface OrgInfo { id: string; name: string }

const FeatureFlagsTab: React.FC = () => {
  const { user } = useAuth();
  const [globalFlags, setGlobalFlags] = useState<FeatureFlag[]>([]);
  const [overrides, setOverrides] = useState<FeatureFlag[]>([]);
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [orgMap, setOrgMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key');

    if (data) {
      setGlobalFlags(data.filter(f => !f.org_id));
      setOverrides(data.filter(f => f.org_id));
    }

    const { data: orgData } = await supabase
      .from('organisations')
      .select('id, name')
      .eq('active', true)
      .order('name');
    if (orgData) {
      setOrgs(orgData);
      const map: Record<string, string> = {};
      orgData.forEach(o => { map[o.id] = o.name; });
      setOrgMap(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const toggleGlobalFlag = async (flag: FeatureFlag) => {
    const newVal = !flag.enabled;
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: newVal, updated_at: new Date().toISOString() })
      .eq('id', flag.id);

    if (!error) {
      setGlobalFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: newVal } : f));
      if (user) {
        await writeAuditLog({
          actorId: user.id,
          action: 'flag.toggle',
          targetType: 'feature_flag',
          targetId: flag.id,
          metadata: { key: flag.key, enabled: newVal },
        });
      }
      showToast(`${flag.key} ${newVal ? 'enabled' : 'disabled'}`);
    }
  };

  const toggleOverride = async (flag: FeatureFlag) => {
    const newVal = !flag.enabled;
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: newVal, updated_at: new Date().toISOString() })
      .eq('id', flag.id);

    if (!error) {
      setOverrides(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: newVal } : f));
      showToast(`Override for ${flag.key} ${newVal ? 'enabled' : 'disabled'}`);
    }
  };

  const deleteOverride = async (flag: FeatureFlag) => {
    if (!confirm(`Remove override for "${flag.key}" in ${orgMap[flag.org_id!] || 'this org'}?`)) return;

    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', flag.id);

    if (!error) {
      setOverrides(prev => prev.filter(f => f.id !== flag.id));
      if (user) {
        await writeAuditLog({
          actorId: user.id,
          action: 'flag.override_delete',
          targetType: 'feature_flag',
          targetId: flag.id,
          metadata: { key: flag.key, org_name: orgMap[flag.org_id!] || flag.org_id },
        });
      }
      showToast(`Override removed`);
    }
  };

  const handleAddOverride = async (flagKey: string, orgId: string, enabled: boolean) => {
    // Find the global flag's description
    const globalFlag = globalFlags.find(f => f.key === flagKey);

    const { error } = await supabase
      .from('feature_flags')
      .insert({
        key: flagKey,
        description: globalFlag?.description || null,
        org_id: orgId,
        enabled,
      });

    if (!error) {
      if (user) {
        await writeAuditLog({
          actorId: user.id,
          action: 'flag.override_create',
          targetType: 'feature_flag',
          metadata: { key: flagKey, org_name: orgMap[orgId] || orgId, enabled },
        });
      }
      showToast(`Override created for ${flagKey}`);
      fetchFlags();
    }
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{
          width: 20, height: 20, border: '3px solid #E2E8F0', borderTopColor: '#38B2AC',
          borderRadius: '50%', animation: 'app-spin 0.7s linear infinite',
          margin: '0 auto',
        }} />
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#718096', marginBottom: 20, marginTop: 0 }}>
        Feature flags let you enable or disable platform features globally or for specific organisations.
      </p>

      {/* Global Flags */}
      <AdminCard padding="24px">
        <AdminSectionLabel text="Global Flags" />
        {globalFlags.length === 0 ? (
          <div style={{ fontSize: 13, color: '#A0AEC0' }}>
            No feature flags configured. Add flags via the Supabase SQL Editor.
          </div>
        ) : (
          globalFlags.map(flag => (
            <div key={flag.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '14px 0', borderBottom: '1px solid #F7FAFC',
            }}>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#2D3748',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {flag.key}
                </div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                  {flag.description}
                </div>
              </div>
              <ToggleSwitch enabled={flag.enabled} onChange={() => toggleGlobalFlag(flag)} />
            </div>
          ))
        )}
      </AdminCard>

      {/* Org-Specific Overrides */}
      <AdminCard padding="24px" style={{ marginTop: 20 }}>
        <AdminSectionLabel text="Org-Specific Overrides" />
        {overrides.length === 0 ? (
          <div>
            <div style={{ fontSize: 13, color: '#A0AEC0', marginBottom: 12 }}>
              No org-specific overrides configured.
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            {/* Table header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '8px 0', borderBottom: '1px solid #E2E8F0',
              fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase',
            }}>
              <span style={{ flex: 1 }}>Flag</span>
              <span style={{ flex: 1 }}>Organisation</span>
              <span style={{ width: 60, textAlign: 'center' }}>Value</span>
              <span style={{ width: 40 }} />
            </div>
            {overrides.map(flag => (
              <div key={flag.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '10px 0', borderBottom: '1px solid #F7FAFC',
              }}>
                <span style={{
                  flex: 1, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#2D3748',
                }}>
                  {flag.key}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: '#2D3748' }}>
                  {orgMap[flag.org_id!] || flag.org_id}
                </span>
                <span style={{ width: 60, display: 'flex', justifyContent: 'center' }}>
                  <ToggleSwitch enabled={flag.enabled} onChange={() => toggleOverride(flag)} />
                </span>
                <button onClick={() => deleteOverride(flag)} style={{
                  width: 40, display: 'flex', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                }}>
                  <Trash2 size={14} color="#FC8181" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setShowAddModal(true)} style={{
          padding: '8px 16px', borderRadius: 24,
          border: '1px solid #E2E8F0', background: '#FFFFFF',
          fontSize: 12, fontWeight: 600, color: '#2D3748', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          + Add Override
        </button>
      </AdminCard>

      {/* Add Override Modal */}
      {showAddModal && (
        <AddOverrideModal
          flagKeys={globalFlags.map(f => f.key)}
          orgs={orgs}
          onSubmit={handleAddOverride}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 20px',
          background: '#1A202C', color: '#FFFFFF', borderRadius: 10,
          fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 9999, fontFamily: "'DM Sans', sans-serif",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default FeatureFlagsTab;
