import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

interface EBProps { children: React.ReactNode }
interface EBState { hasError: boolean; error: Error | null }

class RootErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RootErrorBoundary] Fatal error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: 48, textAlign: 'center',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          background: '#F7FAFC',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A202C', margin: '0 0 8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#718096', maxWidth: 420, lineHeight: 1.6, marginBottom: 24 }}>
            The page encountered an unexpected error. This usually fixes itself – click below to reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#38B2AC', color: '#FFFFFF', border: 'none',
              borderRadius: 24, padding: '12px 32px',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            Reload page
          </button>
          <button
            onClick={() => { window.location.href = '/app/dashboard'; }}
            style={{
              background: 'none', color: '#718096', border: 'none',
              fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Go to Dashboard
          </button>
          {this.state.error && (
            <details style={{ marginTop: 24, fontSize: 11, color: '#A0AEC0', maxWidth: 500, textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: 4 }}>Technical details</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);
