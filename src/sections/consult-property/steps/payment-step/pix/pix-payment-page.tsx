'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Clock } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import BottomSheet from '@/components/bottom-sheet'
import Input from '@/components/input'
import LoadingOverlay from '@/components/loading-overlay'
import PixIcon from '@/components/icons/pix-icon'
import Alert from '@/components/alert'

import { processPayment, getPaymentStatus } from '@/services/payments'
import { startAuth } from '@/services/account'
import { formatMoney } from '@/utils/text'
import { queryKey } from '@/constants/queries'
import { validations, FormTypes } from './validations'

import { AuthCodePage } from './AuthCodePage/AuthCodePage'

interface PixPaymentPageProps {
  onCancel: () => void
  onFinish: () => void
  placeId?: string
}

type Step = 'details' | 'auth' | 'pix'

const FIXED_PLAN_ID = '019aea72-ccab-76ee-883c-72cce61cedbb'
const STORAGE_KEY = '@pix-payment:form-data'

export function PixPaymentPage({ onCancel, onFinish, placeId }: PixPaymentPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  const parentForm = useFormContext()
  const rawComplement = parentForm?.getValues('addressComplement')
  const rawRegistrationNumber = parentForm?.getValues('registrationNumber')

  const uploadedDoc = parentForm?.getValues('document')
  const documentId = uploadedDoc?.id

  const notary = parentForm?.getValues('registry')?.name

  const addressComplement = rawComplement && rawComplement.trim().length > 0
    ? rawComplement
    : undefined

  const registrationNumber = rawRegistrationNumber && rawRegistrationNumber.trim().length > 0
    ? rawRegistrationNumber
    : undefined


  const [step, setStep] = useState<Step>('details')
  const [copied, setCopied] = useState(false)
  const [expirationTime, setExpirationTime] = useState('')
  const [serverError, setServerError] = useState('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [isOpenConfirmPaymentBottomSheet, setIsOpenConfirmPaymentBottomSheet] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    defaultValues: {
      code: '',
      placeId: placeId || '',
      name: '',
      document: '',
      email: '',
      whatsapp: '',
    }
  })

  const {
    register,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = methods

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (parsed.name) setValue('name', parsed.name)
        if (parsed.document) setValue('document', parsed.document)
        if (parsed.whatsapp) setValue('whatsapp', parsed.whatsapp)

        if (parsed.email && status !== 'authenticated') {
          setValue('email', parsed.email)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }, [setValue, status])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      setValue('email', session.user.email)
    }
  }, [status, session, setValue])

  useEffect(() => {
    if (paymentId) {
      setStep('pix')
    }
  }, [paymentId])

  function clearServerError() {
    setServerError('')
  }

  function handleCloseBottomSheet() {
    if (step === 'details') {
      if (!paymentId && onCancel) {
        onCancel()
      }
    }
  }

  const { mutateAsync: generatePix, data: pixData, isPending: isPixPending } = useMutation({
    mutationFn: processPayment,
    onSuccess(payment) {
      setPaymentId(payment?.id)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
      const formatted = `${String(expiresAt.getHours()).padStart(2, '0')}:${String(expiresAt.getMinutes()).padStart(2, '0')}`
      setExpirationTime(formatted)
    },
  })

  const { data: paymentStatusData } = useQuery({
    queryKey: [queryKey.paymentStatus, paymentId],
    queryFn: () => getPaymentStatus(paymentId as string),
    enabled: !!paymentId,
    refetchInterval: (queryData) => {
      if (queryData?.state?.data?.status === 'CONFIRMED') {
        onFinish()
        return false
      }
      return 5000
    },
    refetchIntervalInBackground: false,
  })

  const handleDetailsSubmit = async () => {
    const isValid = await trigger(['name', 'document', 'email', 'whatsapp'])

    if (!isValid) return

    const formData = getValues()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: formData.name,
      document: formData.document,
      email: formData.email,
      whatsapp: formData.whatsapp,
    }))

    const finalPlaceId = formData.placeId || placeId

    if (!finalPlaceId) {
      setServerError('Erro: Identificador do imóvel não encontrado.')
      return
    }

    clearServerError()
    setIsAuthLoading(true)

    const whatsappClean = formData.whatsapp.replace(/\D/g, '').slice(0, 12)

    if (status === 'authenticated') {
      try {
        await generatePix({
          place_id: finalPlaceId,
          plan_id: FIXED_PLAN_ID,
          document_id: documentId,
          name: formData.name,
          document: formData.document,
          whatsapp: whatsappClean,
          complement: addressComplement,
          registration_number: registrationNumber,
          notary
        })
        setStep('pix')
      } catch (error: any) {
        console.log('❌ Erro capturado:', error);

        const isUnauthorized =
          error?.code === 'token_not_valid' ||
          error?.detail === 'Given token not valid for any token type' ||
          error?.response?.status === 401 ||
          error?.status === 401;

        if (isUnauthorized) {
          console.log('🔄 Token inválido detectado. Renovando autenticação...');

          await signOut({ redirect: false })

          try {
            await startAuth({ email: formData.email })
            setStep('auth')
          } catch (authError) {
            console.error(authError)
            setServerError('Sessão expirada. Verifique seu e-mail.')
            setStep('details')
          }
        } else {
          setServerError('Erro ao processar pagamento. Tente novamente.')
          setStep('details')
        }
      } finally {
        setIsAuthLoading(false)
      }
    } else {
      try {
        await startAuth({ email: formData.email })
        setStep('auth')
      } catch (error) {
        setServerError('Não foi possível enviar o código. Verifique o e-mail.')
      } finally {
        setIsAuthLoading(false)
      }
    }
  }

  const handleAuthSuccess = async (code: string) => {
    setServerError('')
    setValue('code', code)

    const formData = getValues()
    const finalPlaceId = formData.placeId || placeId

    if (!finalPlaceId) {
      setServerError('Erro: Identificador do imóvel não encontrado.')
      return
    }

    setIsAuthLoading(true)

    const whatsappClean = formData.whatsapp.replace(/\D/g, '').slice(0, 12)

    try {
      await generatePix({
        place_id: finalPlaceId,
        plan_id: FIXED_PLAN_ID,
        document_id: documentId,
        name: formData.name,
        document: formData.document,
        whatsapp: whatsappClean,
        complement: addressComplement,
        registration_number: registrationNumber,
        notary
      })

      setStep('pix')
    } catch (error) {
    } finally {
      setIsAuthLoading(false)
    }
  }
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixData?.payload || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

      if (isDevMode) {
        console.log('🔧 DEV MODE: Simulando pagamento confirmado...')

        setTimeout(() => {
          onFinish()
        }, 1500)
      }

    } catch (error) {
      console.error(error)
    }
  }

  const isLoading = isAuthLoading || isPixPending

  if (status === 'loading') {
    return <LoadingOverlay isLoading={true} message="Carregando..." />
  }

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col relative px-4 mt-6">
        {step === 'details' && (
          <BottomSheet isOpen={true} onClose={handleCloseBottomSheet}>
            <div className="p-4 pb-12 max-h-[85vh] overflow-y-auto flex flex-col gap-3">

              <div className="flex flex-row gap-3 items-center mb-2">
                <div className="rounded-full bg-violet-50 size-14 flex items-center justify-center">
                  <div className="rounded-full size-10 bg-violet-100 flex items-center justify-center">
                    <PixIcon className="size-7 text-primary" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold leading-6 text-dark">Dados para o PIX</p>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
                {!!serverError && <Alert variant="error" message={serverError} />}

                <Input {...register('name')} errors={errors} label="Nome do titular" placeholder="Ex: Roberto Silva" onKeyDown={clearServerError} />
                <Input {...register('document')} errors={errors} label="CPF" placeholder="000.000.000-00" mask="cpf" inputMode="numeric" onKeyDown={clearServerError} />

                {status === 'authenticated' ? (
                  <input type="hidden" {...register('email')} />
                ) : (
                  <Input
                    {...register('email')}
                    errors={errors}
                    label="E-mail"
                    placeholder="email@email.com"
                    onKeyDown={clearServerError}
                  />
                )}

                <Input {...register('whatsapp')} errors={errors} label="WhatsApp" placeholder="(99) 99999-9999" mask="whatsapp" inputMode="numeric" onKeyDown={clearServerError} />

                <Button type="button" onClick={handleDetailsSubmit} disabled={isLoading}>
                  {isLoading ? 'Processando...' : 'Continuar'}
                </Button>
              </form>
            </div>
          </BottomSheet>
        )}

        {step === 'auth' && (
          <AuthCodePage
            onBack={() => setStep('details')}
            onSuccess={handleAuthSuccess}
          />
        )}

        {step === 'pix' && !!pixData && (
          <div className="flex flex-col items-center pt-10 -mt-27">
            <div className="mb-6 text-white px-1 text-left relative z-10 w-full text-center">
              <p className="text- leading-snug font-normal text-color-background">
                Pague <span className="font-bold">{formatMoney(pixData.value)}</span> via Pix para garantir <br />
                sua compra
              </p>
            </div>

            <div className="mx-auto mb-8 relative z-10 shadow-xl rounded-2xl w-fit -mt-5">
              <div className="bg-primary p-1.5 rounded-2xl">
                <div className="bg-white p-1.5 rounded-xl">
                  <div className="w-32 h-32 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    {isPixPending && <Skeleton className="w-full h-full object-contain" />}
                    {!!pixData && (
                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixData.payload)}&margin=0`}
                        alt="QR Pix"
                        className="w-full h-full object-contain"
                        width={150}
                        height={150}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

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

              {/* Aviso visual somente em Dev Mode (Opcional, mas ajuda muito) */}
              {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && step === 'pix' && (
                <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 text-xs rounded text-center border border-yellow-200">
                  🚧 <strong>Modo Dev Ativo:</strong> Ao copiar o código, o pagamento será aprovado automaticamente.
                </div>
              )}
              <div className="flex items-center gap-2 text-primary font-medium text-sm py-4">
                <Clock size={18} className="animate-spin" />
                <span>Aguardando pagamento</span>
              </div>
            </div>
          </div>
        )}

        <LoadingOverlay isLoading={isLoading} message={step === 'details' ? "Gerando Pix..." : "Processando..."} />
      </div>
    </FormProvider>
  )
}