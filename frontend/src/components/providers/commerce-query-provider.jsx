'use client';

import { HydrationBoundary, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { commerceAuthenticationMergedEvent } from '@/features/commerce/merge-guest-commerce';
import { commerceKeys } from '@/features/commerce/query-keys';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export default function CommerceQueryProvider({ children, dehydratedState }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const refreshAuthenticatedCommerce = () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.all });
    };
    window.addEventListener(commerceAuthenticationMergedEvent, refreshAuthenticatedCommerce);
    return () => window.removeEventListener(commerceAuthenticationMergedEvent, refreshAuthenticatedCommerce);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
