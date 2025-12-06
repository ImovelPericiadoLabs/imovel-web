'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react' // <--- Importante

export function Providers({ children }: { children: React.ReactNode }) {
  // Boa prática no App Router: criar o client dentro do componente para evitar
  // compartilhamento de estado entre requisições no server-side rendering.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider> {/* Envolvemos tudo com a Sessão */}
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}