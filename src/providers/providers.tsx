'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { SessionMonitor } from '@/components/auth/SessionMonitor'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider refetchInterval={0}>
      <QueryClientProvider client={queryClient}>
        <SessionMonitor />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}