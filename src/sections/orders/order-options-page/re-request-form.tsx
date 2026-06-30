'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { getMe } from '@/services/account'
import {
  rerequestOrder,
  listPlans,
  orderQueryKey,
  orderEventsQueryKey,
  ordersListQueryKey,
  type ReRequestOrderBody,
  type PlaceResponse
} from '@/services/orders'
import {
  listAddresses,
  listAddress,
  listRegistry,
  type AddressConfirmPayload,
} from '@/services/addresses'
import { ApiError } from '@/utils/api/errors'
import { cn } from '@/utils/tailwind'
import Input from '@/components/input'
import Button from '@/components/button'
import AutoCompleteAddressInput from '@/components/auto-complete-address-input'
import LoadingOverlay from '@/components/loading-overlay'
import useDebounce from '@/hooks/use-debounce'
import { queryKey } from '@/constants/queries'

const REREQUEST_COOLDOWN_MS = 60_000

type Step = 'address' | 'complement' | 'submit'

const emptyPlaceResponse = (): PlaceResponse => ({
  formatted_address: '',
  street_number: '',
  route: '',
  neighborhood: '',
  sublocality: '',
  city: '',
  state: '',
  country: '',
  postal_code: ''
})

function placeResponseFromOrder(order: {
  place_response?: PlaceResponse | null
  formatted_address?: string | null
  place_id?: string
}): PlaceResponse {
  if (order?.place_response && typeof order.place_response === 'object') {
    return { ...emptyPlaceResponse(), ...order.place_response }
  }
  const formatted = order?.formatted_address ?? ''
  return { ...emptyPlaceResponse(), formatted_address: formatted }
}

type Props = {
  orderId: string
  order: {
    place_response?: PlaceResponse | null
    formatted_address?: string | null
    place_id?: string
    lot_number?: string | null
    block_number?: string | null
    lot_name?: string | null
    complement?: string | null
  }
  onClose: () => void
}

export default function ReRequestForm({ orderId, order, onClose }: Props) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('address')
  const [place_response, setPlaceResponse] = useState<PlaceResponse>(() =>
    placeResponseFromOrder(order)
  )
  const [place_id, setPlaceId] = useState(order?.place_id ?? '')
  const [addressSearch, setAddressSearch] = useState('')
  const [notary, setNotary] = useState('')
  const [lot_number, setLotNumber] = useState(order?.lot_number ?? '')
  const [block_number, setBlockNumber] = useState(order?.block_number ?? '')
  const [lot_name, setLotName] = useState(order?.lot_name ?? '')
  const [tower, setTower] = useState(order?.complement ?? '')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [insufficientHighlight, setInsufficientHighlight] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const debouncedSearch = useDebounce(addressSearch, 1000)
  const hasAddress =
    Boolean(place_response?.formatted_address?.trim()) ||
    Boolean(place_response?.route?.trim()) ||
    Boolean(place_response?.postal_code?.trim())

  const { data: addressOptions, isLoading: isLoadingAddresses } = useQuery({
    queryKey: [queryKey.getAddresses, debouncedSearch],
    queryFn: () => listAddresses(debouncedSearch),
    enabled:
      showSearch &&
      debouncedSearch === addressSearch &&
      debouncedSearch.length >= 3,
    refetchOnWindowFocus: false,
    retry: 1
  })

  const { mutateAsync: fetchAddress, isPending: isLoadingAddress } = useMutation({
    mutationFn: listAddress
  })

  const { mutateAsync: fetchRegistry, isPending: isLoadingRegistry } = useMutation({
    mutationFn: listRegistry,
    onSuccess(data) {
      if (data?.name) setNotary(data.name)
    }
  })

  useEffect(() => {
    const addr =
      order?.place_response?.formatted_address || order?.formatted_address
    if (addr?.trim()) {
      fetchRegistry(addr).then(reg => {
        if (reg?.name) setNotary(reg.name)
      })
    }
  }, [order?.place_response?.formatted_address, order?.formatted_address, fetchRegistry])

  useEffect(() => {
    if (cooldownUntil <= 0) return
    const tick = () => {
      const now = Date.now()
      if (now >= cooldownUntil) {
        setCooldownUntil(0)
        setCooldownSeconds(0)
        setSubmitError(null)
        return
      }
      setCooldownSeconds(Math.ceil((cooldownUntil - now) / 1000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const handleSelectAddress = useCallback(
    async (placeId: string) => {
      const query = addressSearch.trim()
      if (!query) return { address: '', addressNumber: null }
      const result = await fetchAddress({ address: query, placeId })
      setPlaceId(placeId)
      if (result.place_response) {
        setPlaceResponse(prev => ({ ...prev, ...result.place_response }))
      } else {
        setPlaceResponse(prev => ({
          ...prev,
          formatted_address: result.address,
          postal_code: result.postalCode?.replace(/\D/g, '').slice(0, 8) ?? ''
        }))
      }
      if (result.address) {
        await fetchRegistry(result.address)
      }
      setShowSearch(false)
      setAddressSearch('')
      return {
        address: result.address,
        addressNumber: result.addressNumber
      }
    },
    [addressSearch, fetchAddress, fetchRegistry]
  )

  const handleConfirmAddress = useCallback(
    async (payload: AddressConfirmPayload) => {
      setPlaceResponse(prev => ({
        ...prev,
        ...payload.place_response,
        formatted_address:
          payload.place_response?.formatted_address ?? payload.address,
        street_number:
          payload.place_response?.street_number ??
          payload.addressNumber ??
          prev.street_number,
      }))
      const registry = await fetchRegistry(payload.address)
      if (registry?.name) setNotary(registry.name)
      setShowSearch(false)
    },
    [fetchRegistry]
  )

  const handleChangeAddress = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressSearch(e.target.value)
  }, [])

  const handleClearAddress = useCallback(() => {
    setAddressSearch('')
  }, [])

  const getValidationError = useCallback(() => {
    if (debouncedSearch?.length > 0 && debouncedSearch.length < 3) {
      return {
        title: 'Texto muito curto',
        subtitle: 'Digite pelo menos 3 caracteres para buscar.'
      }
    }
    return null
  }, [debouncedSearch])

  const displayError = getValidationError()
  const options = addressOptions ?? []

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: listPlans
  })

  const plans = Array.isArray(plansData) ? plansData : []
  const planPrice = typeof plans[0]?.price === 'number' ? plans[0].price : 0
  const creditsBalance = typeof me?.credits_balance === 'number' ? me.credits_balance : 0
  const insufficientCredits = planPrice > 0 && creditsBalance < planPrice

  const mutation = useMutation({
    mutationFn: (body: ReRequestOrderBody) => rerequestOrder(orderId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKey(orderId) })
      queryClient.invalidateQueries({ queryKey: orderEventsQueryKey(orderId) })
      queryClient.invalidateQueries({ queryKey: ordersListQueryKey })
      onClose()
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
        setInsufficientHighlight(err.code === 'insufficient_credits')
        if (err.code === 'rerequest_cooldown') {
          setCooldownUntil(Date.now() + REREQUEST_COOLDOWN_MS)
          setCooldownSeconds(Math.ceil(REREQUEST_COOLDOWN_MS / 1000))
        }
      } else {
        setSubmitError(
          err instanceof Error ? err.message : 'Erro ao re-solicitar.'
        )
        setInsufficientHighlight(false)
      }
    }
  })

  const isSubmitting = mutation.isPending
  const isCooldown = cooldownSeconds > 0
  const submitDisabled =
    insufficientCredits || isSubmitting || isCooldown

  function buildBody(): ReRequestOrderBody {
    const body: ReRequestOrderBody = {}
    const pr: PlaceResponse = { ...place_response }
    const rawCep = (pr.postal_code ?? '').replace(/\D/g, '').slice(0, 8)
    if (rawCep.length === 8) pr.postal_code = rawCep
    else if (pr.postal_code !== undefined) pr.postal_code = undefined
    const hasAnyAddress =
      pr.formatted_address?.trim() ||
      pr.route?.trim() ||
      pr.postal_code ||
      pr.city?.trim()
    if (hasAnyAddress) body.place_response = pr
    if (place_id.trim()) body.place_id = place_id.trim()
    if (notary.trim()) body.notary = notary.trim()
    if (lot_number.trim()) body.lot_number = lot_number.trim()
    if (block_number.trim()) body.block_number = block_number.trim()
    if (lot_name.trim()) body.lot_name = lot_name.trim()
    if (tower.trim()) body.tower = tower.trim()
    return body
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitDisabled) return
    setSubmitError(null)
    setInsufficientHighlight(false)
    if (insufficientCredits) {
      setSubmitError('Saldo insuficiente.')
      setInsufficientHighlight(true)
      return
    }
    const hasAddress =
      place_response?.formatted_address?.trim() ||
      place_response?.postal_code?.trim() ||
      place_id.trim()
    if (!hasAddress) {
      setSubmitError('Preencha o endereço para continuar.')
      return
    }
    mutation.mutate(buildBody())
  }

  const canGoNextFromAddress =
    Boolean(place_response?.formatted_address?.trim()) ||
    Boolean(place_response?.postal_code?.trim()) ||
    Boolean(place_response?.route?.trim())

  return (
    <div
      id="re-solicitar"
      className="flex flex-col gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Re-solicitar consulta
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Fechar
        </button>
      </div>

      <div className="flex gap-2 text-xs font-medium text-gray-500">
        <span
          className={cn(
            step === 'address' && 'text-primary font-semibold'
          )}
        >
          1. Endereço
        </span>
        <span>/</span>
        <span
          className={cn(
            step === 'complement' && 'text-primary font-semibold'
          )}
        >
          2. Complemento
        </span>
        <span>/</span>
        <span
          className={cn(
            step === 'submit' && 'text-primary font-semibold'
          )}
        >
          3. Enviar
        </span>
      </div>

      {insufficientCredits && (
        <p className="text-sm text-red-600 font-medium" role="alert">
          Saldo insuficiente. Necessário R$ {planPrice.toFixed(2)} (saldo: R${' '}
          {creditsBalance.toFixed(2)}).
        </p>
      )}

      {isCooldown && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200"
          role="status"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm tabular-nums">
            {cooldownSeconds}s
          </span>
          <p className="text-sm text-amber-800 leading-snug">
            Uma re-solicitação já está em andamento. Aguarde{' '}
            <strong>{cooldownSeconds} segundos</strong> para tentar novamente.
          </p>
        </div>
      )}

      {submitError && !isCooldown && (
        <p
          className={cn(
            'text-sm font-medium',
            insufficientHighlight ? 'text-red-600' : 'text-amber-700'
          )}
          role="alert"
        >
          {submitError}
        </p>
      )}

      {step === 'address' && (
        <div className="flex flex-col gap-4">
          {!showSearch ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Edite o endereço ou busque outro
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(true)
                    setTimeout(() => inputRef.current?.focus(), 100)
                  }}
                  className="flex items-center gap-1.5 text-primary font-semibold text-sm"
                >
                  <Search className="size-4" />
                  Buscar outro endereço
                </button>
              </div>

              <Input
                label="Endereço formatado"
                name="formatted_address"
                value={place_response?.formatted_address ?? ''}
                onChange={e =>
                  setPlaceResponse(prev => ({
                    ...prev,
                    formatted_address: e.target.value
                  }))
                }
                placeholder="Ex.: Rua Example, 123 - Bairro"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="CEP"
                  name="postal_code"
                  value={place_response?.postal_code ?? ''}
                  onChange={e =>
                    setPlaceResponse(prev => ({
                      ...prev,
                      postal_code: e.target.value
                    }))
                  }
                  placeholder="00000-000"
                  mask="cep"
                />
                <Input
                  label="Número"
                  name="street_number"
                  value={place_response?.street_number ?? ''}
                  onChange={e =>
                    setPlaceResponse(prev => ({
                      ...prev,
                      street_number: e.target.value
                    }))
                  }
                  placeholder="Nº"
                />
              </div>
              <Input
                label="Logradouro"
                name="route"
                value={place_response?.route ?? ''}
                onChange={e =>
                  setPlaceResponse(prev => ({
                    ...prev,
                    route: e.target.value
                  }))
                }
                placeholder="Rua, Av."
              />
              <Input
                label="Bairro"
                name="neighborhood"
                value={place_response?.neighborhood ?? ''}
                onChange={e =>
                  setPlaceResponse(prev => ({
                    ...prev,
                    neighborhood: e.target.value
                  }))
                }
                placeholder="Bairro"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cidade"
                  name="city"
                  value={place_response?.city ?? ''}
                  onChange={e =>
                    setPlaceResponse(prev => ({
                      ...prev,
                      city: e.target.value
                    }))
                  }
                  placeholder="Cidade"
                />
                <Input
                  label="Estado"
                  name="state"
                  value={place_response?.state ?? ''}
                  onChange={e =>
                    setPlaceResponse(prev => ({
                      ...prev,
                      state: e.target.value.toUpperCase().slice(0, 2)
                    }))
                  }
                  placeholder="UF"
                  maxLength={2}
                />
              </div>

              <Button
                type="button"
                onClick={() => setStep('complement')}
                disabled={!canGoNextFromAddress}
                icon={<ChevronRight className="size-5" />}
              >
                Próximo: Complemento
              </Button>
            </>
          ) : (
            <>
              <div className="relative">
                <AutoCompleteAddressInput
                  ref={inputRef}
                  placeholder="Buscar endereço"
                  options={options}
                  value={addressSearch}
                  onChange={handleChangeAddress}
                  onConfirm={handleConfirmAddress}
                  isLoading={isLoadingAddresses}
                  onSelectAddress={handleSelectAddress}
                  isLoadingAddress={isLoadingAddress}
                  error={displayError}
                  isDirty={
                    debouncedSearch === addressSearch &&
                    addressSearch.length >= 3
                  }
                  onClear={handleClearAddress}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar busca
              </button>
            </>
          )}
        </div>
      )}

      {step === 'complement' && (
        <div className="flex flex-col gap-4">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Endereço
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {place_response?.formatted_address ||
                [place_response?.route, place_response?.street_number]
                  .filter(Boolean)
                  .join(', ') ||
                place_response?.postal_code ||
                '—'}
            </p>
          </div>

          <Input
            label="Cartório"
            name="notary"
            value={notary}
            onChange={e => setNotary(e.target.value)}
            placeholder="Ex.: 1º Cartório de Registro de Imóveis"
          />
          <Input
            label="Quadra"
            name="block_number"
            value={block_number}
            onChange={e => setBlockNumber(e.target.value)}
            placeholder="Opcional"
          />
          <Input
            label="Lote"
            name="lot_number"
            value={lot_number}
            onChange={e => setLotNumber(e.target.value)}
            placeholder="Opcional"
          />
          <Input
            label="Loteamento"
            name="lot_name"
            value={lot_name}
            onChange={e => setLotName(e.target.value)}
            placeholder="Opcional"
          />
          <Input
            label="Bloco / Apt"
            name="tower"
            value={tower}
            onChange={e => setTower(e.target.value)}
            placeholder="Opcional"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('address')}
              icon={<ChevronLeft className="size-5" />}
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={() => setStep('submit')}
              icon={<ChevronRight className="size-5" />}
            >
              Revisar e enviar
            </Button>
          </div>
        </div>
      )}

      {step === 'submit' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Endereço
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {place_response?.formatted_address ||
                [place_response?.route, place_response?.street_number]
                  .filter(Boolean)
                  .join(', ') ||
                place_response?.postal_code ||
                '—'}
            </p>
            {(place_response?.postal_code || place_response?.city) && (
              <p className="text-xs text-gray-600">
                {[place_response.postal_code, place_response.city, place_response.state]
                  .filter(Boolean)
                  .join(' - ')}
              </p>
            )}
          </div>
          {notary && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Cartório:</span> {notary}
            </p>
          )}
          {(lot_number || block_number || lot_name || tower) && (
            <p className="text-xs text-gray-600">
              {[lot_number, block_number, lot_name, tower]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('complement')}
              disabled={isSubmitting}
              icon={<ChevronLeft className="size-5" />}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 shrink-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Enviando...
                </span>
              ) : isCooldown ? (
                `Aguarde ${cooldownSeconds}s`
              ) : (
                'Enviar re-solicitação'
              )}
            </Button>
          </div>
        </form>
      )}

      <LoadingOverlay
        isLoading={isLoadingRegistry || isSubmitting}
        message={isSubmitting ? 'Enviando re-solicitação...' : 'Buscando cartório'}
      />
    </div>
  )
}
