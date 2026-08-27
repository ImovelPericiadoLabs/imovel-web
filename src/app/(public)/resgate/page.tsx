import type { Metadata } from 'next'
import { Suspense } from 'react'

import ResgateClient from './resgate-client'

export const metadata: Metadata = {
  title: 'Resgatar voucher | Imóvel Periciado',
  description: 'Confira o benefício do seu voucher e use na sua consulta de imóvel.',
  // Fora do índice: a URL carrega o código na query. Indexada, um voucher legítimo
  // poderia ser encontrado por busca antes de chegar às mãos de quem recebeu o cartão.
  robots: { index: false, follow: false },
}

function ResgateFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#0b1b3a]" />
    </div>
  )
}

export default function ResgatePage() {
  return (
    <Suspense fallback={<ResgateFallback />}>
      <ResgateClient />
    </Suspense>
  )
}
