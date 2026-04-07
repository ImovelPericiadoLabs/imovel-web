'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const ConsultProperty = dynamic(() => import('@/sections/consult-property'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  ),
})

function ConsultPropertyFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function ConsultPropertyClient() {
  return (
    <Suspense fallback={<ConsultPropertyFallback />}>
      <ConsultProperty />
    </Suspense>
  )
}
