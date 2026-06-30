'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Inbox, ShieldCheck, Unplug } from 'lucide-react'

import { Surface } from '@/components/ui/surfaces'
import { HeroTitle } from '@/components/ui/typography'
import Button from '@/components/button'
import { formatDateWithTime } from '@/utils/date'
import {
  listConnectedPartners,
  revokeConnectedPartner,
  type ConnectedPartner,
} from '@/services/partners'

const CONNECTED_PARTNERS_QUERY_KEY = ['connected-partners'] as const

export default function ParceirosClient() {
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: CONNECTED_PARTNERS_QUERY_KEY,
    queryFn: listConnectedPartners,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const revoke = useMutation({
    mutationFn: (id: string) => revokeConnectedPartner(id),
    onMutate: (id: string) => setPendingId(id),
    onSettled: () => {
      setPendingId(null)
      queryClient.invalidateQueries({ queryKey: CONNECTED_PARTNERS_QUERY_KEY })
    },
  })

  const partners: ConnectedPartner[] = data ?? []

  return (
    <div className="relative z-40 mx-auto flex min-h-[80vh] w-full max-w-4xl flex-1 flex-col gap-5 px-4 pb-24 md:pb-0">
      <Surface variant="dark">
        <HeroTitle variant="large">Parceiros conectados</HeroTitle>
      </Surface>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
        </div>
      ) : partners.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center opacity-80">
          <Inbox className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-base font-medium text-gray-900">Nenhum parceiro conectado</h3>
          <p className="mt-1 text-sm text-gray-400">
            Os parceiros que você autorizar a acessar sua conta aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-col gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{partner.application}</p>
                  <p className="text-sm text-slate-500">{partner.organization}</p>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {partner.scopes.map((scope) => (
                    <li
                      key={scope.id}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      {scope.description}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-slate-400">
                  Autorizado em {formatDateWithTime(partner.granted_at)}
                </p>
              </div>

              <Button
                variant="outline"
                icon={<Unplug className="size-5" />}
                className="md:w-auto"
                disabled={revoke.isPending && pendingId === partner.id}
                onClick={() => revoke.mutate(partner.id)}
              >
                {revoke.isPending && pendingId === partner.id ? 'Revogando...' : 'Revogar acesso'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
