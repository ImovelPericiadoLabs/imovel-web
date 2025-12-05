'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect, useEffectEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Clock, Mail, ArrowLeft, AlertCircle } from 'lucide-react'
import { signIn } from 'next-auth/react'

import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import BottomSheet from '@/components/bottom-sheet'
import Input from '@/components/input'
import LoadingOverlay from '@/components/loading-overlay'
import PixIcon from '@/components/icons/pix-icon'
import Alert from '@/components/alert'
import { InputOtp } from '@/sections/login/components/InputOtp'

import { processPayment, getPaymentStatus } from '@/services/payments'
import { startAuth } from '@/services/account'
import { formatMoney } from '@/utils/text'
import { queryKey } from '@/constants/queries'
import { formatDateWithTime } from '@/utils/date'
import { validations, FormTypes } from './validations'

interface PixPaymentPageProps {
  onCancel: () => void
  onFinish: () => void
  placeId?: string
}

type Step = 'details' | 'auth'

const FIXED_PLAN_ID = '019aea72-ccab-76ee-883c-72cce61cedbb'

export function PixPaymentPage({ onCancel, onFinish, placeId }: PixPaymentPageProps) {
  const router = useRouter()

  const [step, setStep] = useState<Step>('details')
  const [copied, setCopied] = useState(false)
  const [isOpenBottomSheet, setIsOpenBottomSheet] = useState(true)
  const [expirationTime, setExpirationTime] = useState('')
  const [serverError, setServerError] = useState('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [isOpenConfirmPaymentBottomSheet, setIsOpenConfirmPaymentBottomSheet] = useState(false)

  const [timer, setTimer] = useState(59)
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const {
    handleSubmit,
    register,
    control,
    trigger,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: {
      code: '',
      placeId: placeId || '',
    }
  })

  useEffect(() => {
    if (step !== 'auth' || timer === 0) return
    const id = setInterval(() => setTimer((prev) => prev - 1), 1000)
    return () => clearInterval(id)
  }, [timer, step])

  function clearServerError() {
    setServerError('')
  }

  function handleCloseBottomSheet() {
    if (step === 'auth') {
      setStep('details')
      return
    }
    setIsOpenBottomSheet(false)
    if (!paymentId && onCancel) {
      onCancel()
    }
  }

  const { mutateAsync: generatePix, data: pixData, isPending: isPixPending } = useMutation({
    mutationFn: processPayment,
    onSuccess(payment) {
      setPaymentId(payment?.id)
      setIsOpenBottomSheet(false)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
      const formatted = `${String(expiresAt.getHours()).padStart(2, '0')}:${String(expiresAt.getMinutes()).padStart(2, '0')}`
      setExpirationTime(formatted)
    },
    onError() {
      setServerError('Erro ao gerar PIX. Tente novamente.')
    },
  })

  const { data: paymentStatusData } = useQuery({
    queryKey: [queryKey.paymentStatus, paymentId],
    queryFn: () => getPaymentStatus(paymentId as string),
    enabled: !!paymentId,
    refetchInterval: (queryData) => {
      if (queryData?.state?.data?.status === 'CONFIRMED') {
        setIsOpenConfirmPaymentBottomSheet(true)
        return false
      }
      return 5000
    },
    refetchIntervalInBackground: false,
  })

  const handleDetailsSubmit = async () => {
    const isValid = await trigger(['name', 'document', 'email', 'whatsapp'])

    if (!isValid) return

    const email = getValues('email')
    setServerError('')
    setIsAuthLoading(true)

    try {
      await startAuth({ email })
      setStep('auth')
      setTimer(59)
    } catch (error) {
      console.error(error)
      setServerError('Não foi possível enviar o código. Verifique o e-mail.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleFinalSubmit: SubmitHandler<FormTypes> = async (formData) => {
    setServerError('')

    if (!formData.code || formData.code.length < 6) {
      setServerError('O código deve ter 6 dígitos.')
      return
    }

    const finalPlaceId = formData.placeId || placeId

    if (!finalPlaceId) {
      setServerError('Erro: Identificador do imóvel/compra não encontrado.')
      return
    }

    setIsAuthLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        code: formData.code,
        redirect: false,
      })

      if (result?.error) {
        setServerError('Código incorreto ou expirado.')
        setIsAuthLoading(false)
        return
      }

      await generatePix({
        place_id: finalPlaceId,
        plan_id: FIXED_PLAN_ID,
        document_id: undefined,
        name: formData.name,
        document: formData.document,
      })
    } catch (error) {
      setServerError('Erro inesperado ao processar.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleResendCode = async () => {
    const email = getValues('email')
    try {
      await startAuth({ email })
      setTimer(59)
      setServerError('')
    } catch (error) {
      setServerError('Erro ao reenviar.')
    }
  }

  const qrCodeUrl = pixData?.payload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.payload)}&margin=0`
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixData?.payload || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) { console.error(error) }
  }

  const openBottomSheet = useEffectEvent(() => setIsOpenBottomSheet(true))
  useEffect(() => { openBottomSheet() }, [])

  const isLoading = isAuthLoading || isPixPending

  return (
    <div className="flex flex-col relative px-4 mt-6">
      <div className="mb-6 -mt-20 text-white px-1 text-left relative z-50">
        <p className="text-[17px] leading-snug font-normal">
          Pague <span className="font-bold">R$ 67,56</span> via Pix para garantir <br />
          sua compra
        </p>
      </div>

      <div className="mx-auto mb-8 relative z-50 shadow-xl rounded-2xl w-fit">
        <div className="bg-primary p-1.5 rounded-2xl">
          <div className="bg-white p-1.5 rounded-xl">
            <div className="w-44 h-44 bg-white rounded-lg overflow-hidden flex items-center justify-center">
              {isPixPending && <Skeleton className="w-full h-full object-contain" />}
              {!pixData && !isPixPending && <PixIcon className="text-gray-300 w-20 h-20" />}
              {!!pixData && (
                <Image src={qrCodeUrl} alt="QR Pix" className="w-full h-full object-contain" width={400} height={400} />
              )}
            </div>
          </div>
        </div>
      </div>

      {!!pixData && (
        <div className="flex flex-col items-center w-full px-1 mt-2 animate-in fade-in">
          <div className="text-center mb-5 w-full">
            <p className="text-dark text-[15px] font-medium">Este código expira em 30 min, pague até {expirationTime}</p>
          </div>
          <div className="w-full bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-[11px] text-gray-600 break-all font-mono text-center uppercase">{pixData.payload}</p>
          </div>
          <Button onClick={handleCopy} type="button">
            <div className="flex items-center justify-center gap-1">
              {copied ? <Check size={20} /> : null}
              <span>{copied ? 'Copiado!' : 'Copiar código pix'}</span>
            </div>
          </Button>
          <div className="flex items-center gap-2 text-primary font-medium text-sm py-4">
            <Clock size={18} className="animate-spin" />
            <span>Aguardando pagamento</span>
          </div>
        </div>
      )}

      {!isOpenConfirmPaymentBottomSheet && (
        <BottomSheet isOpen={isOpenBottomSheet} onClose={handleCloseBottomSheet}>
          <div className="p-4 pb-12 max-h-[85vh] overflow-y-auto flex flex-col gap-3">

            <div className="flex flex-row gap-3 items-center mb-2">
              {step === 'auth' ? (
                <button onClick={() => setStep('details')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                  <ArrowLeft className="size-6 text-gray-600" />
                </button>
              ) : (
                <div className="rounded-full bg-violet-50 size-14 flex items-center justify-center">
                  <div className="rounded-full size-10 bg-violet-100 flex items-center justify-center">
                    <PixIcon className="size-7 text-primary" />
                  </div>
                </div>
              )}
              <p className="text-lg font-semibold leading-6 text-dark">
                {step === 'details' ? 'Dados do PIX' : 'Confirmar código'}
              </p>
            </div>

            <form onSubmit={handleSubmit(handleFinalSubmit)} className="flex flex-col gap-4">
              {!!serverError && <Alert variant="error" message={serverError} />}

              <div className={step === 'details' ? 'flex flex-col gap-4' : 'hidden'}>
                <Input {...register('name')} errors={errors} label="Nome do titular" placeholder="Ex: Roberto Silva" onKeyDown={clearServerError} />
                <Input {...register('document')} errors={errors} label="CPF" placeholder="000.000.000-00" mask="cpf" inputMode="numeric" onKeyDown={clearServerError} />
                <Input {...register('email')} errors={errors} label="E-mail" placeholder="email@email.com" onKeyDown={clearServerError} />
                <Input {...register('whatsapp')} errors={errors} label="WhatsApp" placeholder="(99) 99999-9999" mask="whatsapp" inputMode="numeric" onKeyDown={clearServerError} />

                <Button type="button" onClick={handleDetailsSubmit} disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Continuar'}
                </Button>
              </div>

              <div className={step === 'auth' ? 'flex flex-col items-center animate-in fade-in slide-in-from-right-8' : 'hidden'}>
                <div className="mb-4 flex items-center justify-center size-14 rounded-full bg-[#F3E8FF]">
                  <Mail className="size-7 text-primary" />
                </div>

                <p className="text-sm text-center text-[#4B4B4B] mb-6 max-w-xs">
                  Enviamos um código para <span className="font-medium">{watch('email')}</span>.
                </p>

                <Controller
                  name="code"
                  control={control}
                  render={({ field, fieldState }) => (
                    <InputOtp
                      value={field.value ?? ''}
                      onChange={(val) => {
                        field.onChange(val)
                        clearServerError()
                      }}
                      length={6}
                      isError={!!fieldState.error || !!serverError}
                    />
                  )}
                />

                <div className="text-xs text-[#4B4B4B] mt-6 mb-6 flex gap-1">
                  {timer === 0 ? (
                    <button type="button" onClick={handleResendCode} className="text-primary font-medium hover:underline">
                      Reenviar agora
                    </button>
                  ) : (
                    <span className="text-primary font-medium">Reenviar em {timer}s</span>
                  )}
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Validando...' : 'Confirmar e Gerar Pix'}
                </Button>
              </div>
            </form>
          </div>
        </BottomSheet>
      )}

      <BottomSheet isOpen={isOpenConfirmPaymentBottomSheet} onClose={() => router.push('/pedidos')}>
        <div className="flex flex-col items-center gap-6 pb-12 px-4 py-8">
          <div className="relative">
            <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-semibold text-dark">Pagamento concluído</span>
            <span className="text-sm font-semibold text-dark">{formatMoney(paymentStatusData?.amount)}</span>
          </div>
          <Button onClick={() => router.push('/pedidos')}>Ir para meus pedidos</Button>
        </div>
      </BottomSheet>

      <LoadingOverlay isLoading={isLoading} message={step === 'auth' ? "Validando..." : "Processando..."} />
    </div>
  )
}