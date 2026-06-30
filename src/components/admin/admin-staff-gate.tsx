'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import Alert from '@/components/alert'
import Skeleton from '@/components/skeleton'
import { getMe } from '@/services/account'

type Props = {
  children: ReactNode
  requireSuperuser?: boolean
}

export default function AdminStaffGate({ children, requireSuperuser = false }: Props) {
  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  const canAccess = requireSuperuser
    ? Boolean(me?.is_superuser)
    : Boolean(me?.is_staff || me?.is_superuser)

  if (!canAccess) {
    return (
      <Alert
        variant="warning"
        icon={<ShieldAlert className="size-5 shrink-0" />}
        message={
          requireSuperuser
            ? 'Esta área é restrita a administradores (superuser).'
            : 'Esta área é restrita à equipe (conta staff). Solicite permissão a um administrador.'
        }
      />
    )
  }

  return <>{children}</>
}
