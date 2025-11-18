"use client"

import { ReactNode, useEffect } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] Service worker registration failed:', error);
        });
    }
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('App Error:', error);
          console.error('Error Info:', errorInfo);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
