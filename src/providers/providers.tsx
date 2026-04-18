'use client'

import { useCallback, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { SessionMonitor } from '@/components/auth/SessionMonitor'
import { SessionRecovery } from '@/components/auth/SessionRecovery'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [sessionMountKey, setSessionMountKey] = useState(0)
  const remountSession = useCallback(() => setSessionMountKey((k) => k + 1), [])

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        key={sessionMountKey}
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <SessionRecovery onRemountSession={remountSession} />
        <SessionMonitor />
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}