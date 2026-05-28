'use client'

import type { SurfaceVariant } from '@/styles/contrast'
import { useSurface } from './SurfaceContext'

export function useTypographySurface(override?: SurfaceVariant): SurfaceVariant {
  const contextSurface = useSurface()
  return override ?? contextSurface
}
