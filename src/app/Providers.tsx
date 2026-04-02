import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../store';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { SocketProvider } from './SocketProvider';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            {children}
          </SocketProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
};
