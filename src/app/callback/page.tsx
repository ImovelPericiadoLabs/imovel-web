import { Suspense } from 'react'

import { JetimobCallbackClient } from './callback-client'

export default function JetimobCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-500">
          Conectando à Jetimob…
        </div>
      }
    >
      <JetimobCallbackClient />
    </Suspense>
  )
}
