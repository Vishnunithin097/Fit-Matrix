import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'

// @ts-ignore
window.React = React;

type AppRoot = ReturnType<typeof createRoot>;

declare global {
  interface Window {
    __FITMATRIX_ROOT__?: AppRoot;
  }
}

function ErrorFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#06070b', color: '#f3f4ff', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>Fit Matrix hit a rendering issue</h1>
        <p style={{ color: '#8b8da9', lineHeight: 1.6 }}>The app is still running, but a component failed to render. Refreshing usually clears it.</p>
      </div>
    </div>
  );
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

if (!window.__FITMATRIX_ROOT__) {
  window.__FITMATRIX_ROOT__ = createRoot(rootElement);
}

window.__FITMATRIX_ROOT__.render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
)