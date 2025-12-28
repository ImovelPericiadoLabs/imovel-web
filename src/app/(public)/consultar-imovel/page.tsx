import { Suspense } from 'react'
import ConsultProperty from '@/sections/consult-property'

export default function ConsultarImovelPage() {
  return (
    <Suspense>
      <ConsultProperty />
    </Suspense>
  )
}
