'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111827',
            color: '#f9fafb',
            fontSize: '14px',
            fontWeight: '500',
            padding: '14px 18px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: '380px',
            lineHeight: '1.5',
          },
          success: {
            style: {
              background: '#111827',
              color: '#f9fafb',
              border: '1px solid rgba(34,197,94,0.3)',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#111827',
            },
          },
          error: {
            style: {
              background: '#111827',
              color: '#f9fafb',
              border: '1px solid rgba(239,68,68,0.3)',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#111827',
            },
          },
          loading: {
            style: {
              background: '#111827',
              color: '#f9fafb',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            iconTheme: {
              primary: '#6b7280',
              secondary: '#111827',
            },
          },
        }}
      />
    </>
  );
}

// Export motion components for easy access throughout the app
export { motion, AnimatePresence };