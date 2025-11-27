'use client'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Clock } from 'lucide-react'
import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import BottomSheet from '@/components/bottom-sheet'
import Input from '@/components/input'
import LoadingOverlay from '@/components/loading-overlay'
import PixIcon from '@/components/icons/pix-icon'
import Alert from '@/components/alert'
import { processPayment, getPaymentStatus } from '@/services/payments'
import { queryKey } from '@/constants/queries'
import { validations, FormTypes } from './validations'

export function PixPaymentPage() {
  const [copied, setCopied] = useState(false)
  const [isOpenBottomSheet, setIsOpenBottomSheet] = useState(true)
  const [expirationTime, setExpirationTime] = useState('')
  const [serverError, setServerError] = useState('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [isOpenConffirmPaymentBottomSheet, setIsOpenConfirmPaymentBottomSheet] = useState(false)

  const { push } = useRouter()

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormTypes>({
    resolver: zodResolver(validations),
  })

  const { getValues, setStep } = useFormContext() as FormContextWithSteps

  function clearServerError() {
    setServerError('')
  }

  function handleCloseBottomSheet() {
    setIsOpenBottomSheet(false)
  }

  const { mutateAsync, data, isPending } = useMutation({
    mutationFn: processPayment,
    onSuccess(payment) {
      setPaymentId(payment?.id)
      handleCloseBottomSheet()

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

      const hours = String(expiresAt.getHours()).padStart(2, '0')
      const minutes = String(expiresAt.getMinutes()).padStart(2, '0')

      const formatted = `${hours}:${minutes}`

      setExpirationTime(formatted)
    },
    onError() {
      setServerError('Houve um erro ao processar o pagamento via PIX. Por favor, tente novamente.')
    },
  })

  useQuery({
    queryKey: [queryKey.paymentStatus, paymentId],
    queryFn: () => getPaymentStatus(paymentId as string),
    enabled: !!paymentId,
    refetchInterval: (data) => {
      if (!data) return 5000

      if (data?.state?.data?.status === 'CONFIRMED') {
        setIsOpenConfirmPaymentBottomSheet(true)
        return false
      }

      return 5000
    },

    refetchIntervalInBackground: false,
  })

  function handleCloseConfirmPaymentBottomSheet() {
    push('/')
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    data?.payload,
  )}&margin=0`

  const amount = '67,56'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data?.payload || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Falha ao copiar código pix:', error)
    }
  }

  async function onSubmit(formData: FormTypes) {
    const values = getValues()
    setServerError('')
    await mutateAsync({
      place_id: values.placeId,
      document_id: values.document?.id,
      name: formData.name,
      document: formData.document,
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpenBottomSheet(true)
  }, [])

  return (
    <div className="flex flex-col relative px-4">
      <div className="mb-6 -mt-20 text-white px-1 text-left relative z-50">
        <p className="text-[17px] leading-snug font-normal">
          Pague <span className="font-bold">R$ {amount}</span> via Pix para garantir <br />
          sua compra
        </p>
      </div>

      <div className="mx-auto mb-8 relative z-50 shadow-xl rounded-2xl w-fit">
        <div className="bg-primary p-1.5 rounded-2xl">
          <div className="bg-white p-1.5 rounded-xl">
            <div className="w-44 h-44 bg-white rounded-lg overflow-hidden flex items-center justify-center">
              {isPending && <Skeleton className="w-full h-full object-contain" />}
              {!!data && (
                <Image
                  src={qrCodeUrl}
                  alt="QR Code para pagamento Pix"
                  className="w-full h-full object-contain"
                  loading="lazy"
                  width={400}
                  height={400}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full px-1 mt-2">
        <div className="text-center mb-5 w-full">
          <p className="text-dark text-[15px] font-medium flex flex-col sm:flex-row items-center justify-center gap-1">
            <span>Este código expira em 30 minutos, pague até {expirationTime}</span>
          </p>
        </div>

        {isPending ? (
          <Skeleton className="w-full rounded-xl p-4 mb-6 h-20" />
        ) : (
          <div className="w-full bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-[11px] text-gray-600 break-all font-mono leading-relaxed text-center uppercase tracking-wide">
              {data?.payload}
            </p>
          </div>
        )}

        <Button
          onClick={handleCopy}
          type="button"
          aria-label={copied ? 'Código copiado' : 'Copiar código Pix'}
          disabled={isPending || !data}
        >
          <div className="flex items-center justify-center gap-1">
            {copied ? <Check size={20} /> : null}
            <span>{copied ? 'Copiado!' : 'Copiar código pix'}</span>
          </div>
        </Button>

        <div className="flex items-center gap-2 text-primary font-medium text-sm py-4">
          <Clock size={18} className="stroke-[2px] animate-[spin_4s_linear_infinite]" />
          <span>Aguardando o pagamento</span>
        </div>
      </div>

      <BottomSheet isOpen={isOpenBottomSheet} onClose={() => setStep(5)}>
        <div className="p-4 pb-12 max-h-[70vh] overflow-y-auto flex flex-col gap-3">
          <div className="flex flex-row gap-3 items-center">
            <div className="rounded-full bg-violet-50 size-14 flex items-center justify-center">
              <div className="rounded-full size-10 bg-violet-100 flex items-center justify-center">
                <PixIcon className="size-7 text-primary" />
              </div>
            </div>

            <p className="text-lg font-semibold leading-6 text-dark">Dados do PIX</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {!!serverError?.length && <Alert variant="error" message={serverError} />}
            <Input
              {...register('name')}
              errors={errors}
              label="Nome do titular"
              placeholder="Ex: Roberto Silva"
              onKeyDown={clearServerError}
            />
            <Input
              {...register('document')}
              errors={errors}
              label="CPF"
              placeholder="000.000.000-00"
              mask="cpf"
              onKeyDown={clearServerError}
              inputMode="numeric"
            />
            <Input
              {...register('email')}
              errors={errors}
              label="E-mail"
              placeholder="email@email.com"
              onKeyDown={clearServerError}
            />
            <Input
              {...register('whatsapp')}
              errors={errors}
              label="WhatsApp"
              placeholder="99 99999-9999"
              mask="whatsapp"
              onKeyDown={clearServerError}
              inputMode="numeric"
            />
            <Button>Continuar</Button>
          </form>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isOpenConffirmPaymentBottomSheet}
        onClose={handleCloseConfirmPaymentBottomSheet}
      >
        <div className="flex flex-col items-center gap-6 pb-12 px-4 py-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Check className="w-10 h-10 text-white stroke-3 animate-[check-draw_0.3s_ease-out_0.2s_both]" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ping opacity-30" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl font-bold text-gray-800">Pagamento confirmado!</span>
            <span className="text-gray-500 text-center">Seu Pix foi recebido com sucesso</span>
          </div>

          <Button onClick={handleCloseConfirmPaymentBottomSheet}>Continuar</Button>
        </div>
      </BottomSheet>

      <LoadingOverlay isLoading={isPending} message="Carregando dados do pix" />
    </div>
  )
}
