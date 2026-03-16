import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import AdminCard from '../AdminCard';
import AdminSectionLabel from '../AdminSectionLabel';
import { supabase } from '../../../lib/supabase';

type HealthStatus = 'online' | 'error' | 'checking';

interface HealthState {
  api: HealthStatus;
  apiKey: HealthStatus;
  supabaseConn: HealthStatus;
  lastChecked: Date | null;
}

const API_ENDPOINTS = [
  { path: '/api/health', method: 'GET', functionId: 'health' },
  { path: '/api/enhance-prompt', method: 'POST', functionId: 'enhanceprompt' },
  { path: '/api/playground', method: 'POST', functionId: 'generateplaygroundprompt' },
  { path: '/api/summarize-role', method: 'POST', functionId: 'summarizerole' },
  { path: '/api/design-agent', method: 'POST', functionId: 'designagent' },
  { path: '/api/agent-setup-guide', method: 'POST', functionId: 'agentsetupguide' },
  { path: '/api/design-workflow', method: 'POST', functionId: 'designworkflow' },
  { path: '/api/analyze-architecture', method: 'POST', functionId: 'analyzearchitecture' },
  { path: '/api/analyze-insight', method: 'POST', functionId: 'analyzeinsight' },
  { path: '/api/generate-pathway', method: 'POST', functionId: 'generatepathway' },
  { path: '/api/design-dashboard', method: 'POST', functionId: 'designdashboard' },
  { path: '/api/generate-prd', method: 'POST', functionId: 'generateprd' },
  { path: '/api/app-build-guide', method: 'POST', functionId: 'appbuildguide' },
  { path: '/api/evaluate-app', method: 'POST', functionId: 'evaluateapp' },
  { path: '/api/evaluate-app-build-plan', method: 'POST', functionId: 'evaluateappbuildplan' },
  { path: '/api/generate-n8n-workflow', method: 'POST', functionId: 'generaten8nworkflow' },
  { path: '/api/generate-build-guide', method: 'POST', functionId: 'generatebuildguide' },
  { path: '/api/resolve-dispute', method: 'POST', functionId: 'resolvedispute' },
];

const PLATFORM_INFO = [
  { label: 'Platform', value: 'OXYGY AI Upskilling' },
  { label: 'Stack', value: 'React 19, Vite 6, TypeScript, Supabase, Firebase' },
  { label: 'AI Models', value: 'Via OpenRouter — Claude Sonnet 4, Gemini 2.0 Flash' },
  { label: 'Endpoints', value: `${API_ENDPOINTS.length} Cloud Functions` },
  { label: 'Hosting', value: 'Firebase Hosting + Cloud Functions' },
  { label: 'Database', value: 'Supabase (PostgreSQL)' },
];

const QUICK_LINKS = [
  { label: 'Firebase Console', url: 'https://console.firebase.google.com' },
  { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard' },
  { label: 'OpenRouter Dashboard', url: 'https://openrouter.ai/dashboard' },
  { label: 'GitHub Repository', url: 'https://github.com/Joseph2913/OXYGY-AI-Upskilling-Production-site' },
];

const SystemTab: React.FC = () => {
  const [health, setHealth] = useState<HealthState>({
    api: 'checking', apiKey: 'checking', supabaseConn: 'checking', lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    const newState: HealthState = { api: 'checking', apiKey: 'checking', supabaseConn: 'checking', lastChecked: null };
    setHealth({ ...newState });

    // API health check
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      newState.api = data.status === 'ok' ? 'online' : 'error';
      newState.apiKey = data.hasApiKey ? 'online' : 'error';
    } catch {
      newState.api = 'error';
      newState.apiKey = 'error';
    }

    // Supabase check
    try {
      const { error } = await supabase.from('organisations').select('id').limit(1);
      newState.supabaseConn = error ? 'error' : 'online';
    } catch {
      newState.supabaseConn = 'error';
    }

    newState.lastChecked = new Date();
    setHealth(newState);
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const statusDot = (status: HealthStatus) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: status === 'online' ? '#48BB78' : status === 'error' ? '#FC8181' : '#ECC94B',
  });

  const statusLabel = (status: HealthStatus, onlineText: string, errorText: string) => ({
    text: status === 'online' ? onlineText : status === 'checking' ? 'Checking...' : errorText,
    color: status === 'online' ? '#22543D' : status === 'checking' ? '#975A16' : '#9B2C2C',
  });

  const healthChecks = [
    { label: 'Health Endpoint', status: health.api, ...statusLabel(health.api, 'Online', 'Offline'), testable: true, onTest: checkHealth },
    { label: 'OpenRouter Key', status: health.apiKey, ...statusLabel(health.apiKey, 'Valid', 'Missing'), testable: true, onTest: checkHealth },
    { label: 'Supabase Connection', status: health.supabaseConn, ...statusLabel(health.supabaseConn, 'Connected', 'Unreachable'), testable: false, onTest: checkHealth },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Platform Summary */}
      <AdminCard padding="24px">
        <AdminSectionLabel text="Platform Summary" />
        {PLATFORM_INFO.map(item => (
          <div key={item.label} style={{
            display: 'flex', padding: '8px 0', borderBottom: '1px solid #F7FAFC',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#718096', width: 120, flexShrink: 0 }}>
              {item.label}
            </span>
            <span style={{ fontSize: 13, color: '#2D3748' }}>{item.value}</span>
          </div>
        ))}
      </AdminCard>

      {/* API Health */}
      <AdminCard padding="24px">
        <AdminSectionLabel text="API Health" />
        {healthChecks.map(check => (
          <div key={check.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid #F7FAFC',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={statusDot(check.status)} />
              <span style={{ fontSize: 13, color: '#2D3748' }}>{check.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: check.color }}>
                {check.text}
              </span>
              {check.testable && (
                <button onClick={check.onTest} style={{
                  fontSize: 11, fontWeight: 600, color: '#38B2AC',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Test →
                </button>
              )}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#A0AEC0' }}>
            {health.lastChecked ? `Last checked: ${health.lastChecked.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Checking...'}
          </span>
          <button onClick={checkHealth} style={{
            fontSize: 12, fontWeight: 600, color: '#38B2AC',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Refresh
          </button>
        </div>
      </AdminCard>

      {/* API Endpoints */}
      <AdminCard padding="24px">
        <AdminSectionLabel text="API Endpoints" />
        <div style={{ overflowX: 'auto' }}>
          {API_ENDPOINTS.map(ep => (
            <div key={ep.path} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '8px 0', borderBottom: '1px solid #F7FAFC', fontSize: 12,
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", color: '#2D3748',
                flex: 1, minWidth: 200,
              }}>
                {ep.path}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: ep.method === 'GET' ? '#C6F6D5' : '#EBF4FF',
                color: ep.method === 'GET' ? '#22543D' : '#2B6CB0',
                flexShrink: 0,
              }}>
                {ep.method}
              </span>
              <span style={{ fontSize: 12, color: '#718096', minWidth: 160 }}>
                {ep.functionId}
              </span>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Quick Links */}
      <AdminCard padding="24px">
        <AdminSectionLabel text="Quick Links" />
        {QUICK_LINKS.map(link => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 0', fontSize: 13, color: '#38B2AC',
              fontWeight: 500, textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} />
            {link.label}
          </a>
        ))}
      </AdminCard>
    </div>
  );
};

export default SystemTab;
