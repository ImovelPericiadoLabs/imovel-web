'use client'

import { createContext, useContext } from 'react'
import type { SurfaceVariant } from '@/styles/contrast'

export const SurfaceContext = createContext<SurfaceVariant>('light')

export function useSurface() {
  return useContext(SurfaceContext)
}
