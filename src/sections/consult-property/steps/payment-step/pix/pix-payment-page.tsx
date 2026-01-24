'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Clock, ChevronRight, Copy } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import BottomSheet from '@/components/bottom-sheet'
import Input from '@/components/input'
import LoadingOverlay from '@/components/loading-overlay'
import PixIcon from '@/components/icons/pix-icon'
import Alert from '@/components/alert'
import AddressSummaryCard from '@/components/address-summary-card'

import { processPayment, getPaymentStatus } from '@/services/payments'
import { startAuth } from '@/services/account'
import { queryKey } from '@/constants/queries'
import { validations, FormTypes } from './validations'
import { trackGtmEvent, buildConsultItem, DEFAULT_CURRENCY, CONSULT_PRODUCT_PRICE } from '@/utils/analytics/gtm'

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
  const { data: session, status } = useSession()
  const parentForm = useFormContext()

  const {
      complement,
      registrationNumber,
      notary,
      documentId,
      allotment,
      block,
      lot
    } = useMemo(() => {
      const rawComplement = parentForm?.getValues('complement')
      const rawRegistrationNumber = parentForm?.getValues('registrationNumber')
      const uploadedDoc = parentForm?.getValues('document')
      const notaryName = parentForm?.getValues('registry')?.name
      const rawAllotment = parentForm?.getValues('allotment')
      const rawBlock = parentForm?.getValues('block')
      const rawLot = parentForm?.getValues('lot')

      return {
        complement: rawComplement?.trim() || undefined,
        registrationNumber: rawRegistrationNumber?.trim() || undefined,
        notary: notaryName,
        documentId: uploadedDoc?.id,
        allotment: rawAllotment?.trim() || undefined,
        block: rawBlock?.trim() || undefined,
        lot: rawLot?.trim() || undefined
      }
    }, [parentForm])

  const [step, setStep] = useState<Step>('details')
  const [copied, setCopied] = useState(false)
  const [expirationTime, setExpirationTime] = useState('')
  const [serverError, setServerError] = useState('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const hasTrackedPaymentConfirmed = useRef(false)
  const hasTrackedPixView = useRef(false)

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
    getValues: getLocalValues,
    setValue,
    trigger,
    formState: { errors },
  } = methods

  // Unificamos os métodos de pegar valores para usar o formulário pai nos campos de endereço
  const getValues = useCallback((field?: string) => {
    const parentFields = ['address', 'registrationNumber', 'allotment', 'block', 'lot', 'complement']
    if (field && parentFields.includes(field)) {
      return parentForm?.getValues(field)
    }
    return getLocalValues(field as keyof FormTypes)
  }, [parentForm, getLocalValues])

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

  const clearServerError = useCallback(() => {
    setServerError('')
  }, [])

  const handleCloseBottomSheet = useCallback(() => {
    if (step === 'details') {
      if (!paymentId && onCancel) {
        onCancel()
      }
    }
  }, [step, paymentId, onCancel])

  const { mutateAsync: generatePix, data: pixData, isPending: isPixPending } = useMutation({
    mutationFn: processPayment,
    onSuccess(payment) {
      if (payment?.id) {
        setPaymentId(payment.id)
      }
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
      const formatted = `${String(expiresAt.getHours()).padStart(2, '0')}:${String(expiresAt.getMinutes()).padStart(2, '0')}`
      setExpirationTime(formatted)

      trackGtmEvent('pix_generated', {
        event_category: 'payment',
        event_label: 'pix_generated',
        event_description: 'Código PIX gerado com sucesso.',
        payment_method: 'pix',
        payment_id: payment?.id,
        currency: DEFAULT_CURRENCY,
        value: CONSULT_PRODUCT_PRICE,
      })
      trackGtmEvent('generate_lead', {
        event_category: 'payment',
        event_label: 'pix_generated',
        event_description: 'Lead gerado ao criar o pagamento via PIX.',
        payment_method: 'pix',
        payment_id: payment?.id,
        currency: DEFAULT_CURRENCY,
        value: CONSULT_PRODUCT_PRICE,
      })
    },
  })

  useQuery({
    queryKey: [queryKey.paymentStatus, paymentId],
    queryFn: () => getPaymentStatus(paymentId as string),
    enabled: !!paymentId,
    refetchInterval: (queryData) => {
      if (queryData?.state?.data?.status === 'CONFIRMED') {
        if (!hasTrackedPaymentConfirmed.current) {
          hasTrackedPaymentConfirmed.current = true
          trackGtmEvent('payment_confirmed', {
            event_category: 'payment',
            event_label: 'confirmed',
            event_description: 'Pagamento confirmado com sucesso.',
            payment_method: 'pix',
            payment_id: paymentId,
          })
          trackGtmEvent('purchase', {
            event_category: 'payment',
            event_label: 'purchase',
            event_description: 'Compra concluída com PIX.',
            payment_method: 'pix',
            payment_id: paymentId,
            currency: DEFAULT_CURRENCY,
            value: CONSULT_PRODUCT_PRICE,
            items: [buildConsultItem(CONSULT_PRODUCT_PRICE)],
          })
        }
        onFinish()
        return false
      }
      return 5000
    },
    refetchIntervalInBackground: false,
  })

  const handleDetailsSubmit = useCallback(async () => {
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

    trackGtmEvent('add_payment_info', {
      event_category: 'payment',
      event_label: 'pix_details',
      event_description: 'Dados para pagamento via PIX foram preenchidos.',
      payment_type: 'pix',
      place_id: finalPlaceId,
      has_document: Boolean(documentId),
      currency: DEFAULT_CURRENCY,
      value: CONSULT_PRODUCT_PRICE,
      items: [buildConsultItem(CONSULT_PRODUCT_PRICE)],
    })

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
          complement,
          registration_number: registrationNumber,
          notary,
          lot_name: allotment,
          block_number: block,
          lot_number: lot
        })
        setStep('pix')
      } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);

        const err = error as { 
          code?: string; 
          detail?: string; 
          response?: { status: number }; 
          status?: number 
        };
      
        const isUnauthorized =
          err?.code === 'token_not_valid' ||
          err?.detail === 'Given token not valid for any token type' ||
          err?.response?.status === 401 ||
          err?.status === 401;

        if (isUnauthorized) {
          await signOut({ redirect: false })

          try {
            trackGtmEvent('auth_code_requested', {
              event_category: 'auth',
              event_label: 'session_expired',
              event_description: 'Sessão expirada. Código de autenticação solicitado.',
              has_email: Boolean(formData.email),
            })
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
        trackGtmEvent('auth_code_requested', {
          event_category: 'auth',
          event_label: 'new_login',
          event_description: 'Código de autenticação solicitado para continuar.',
          has_email: Boolean(formData.email),
        })
        await startAuth({ email: formData.email })
        setStep('auth')
      } catch {
        setServerError('Não foi possível enviar o código. Verifique o e-mail.')
      } finally {
        setIsAuthLoading(false)
      }
    }
  }, [trigger, getValues, placeId, clearServerError, status, generatePix, documentId, complement, registrationNumber, notary, allotment, block, lot])

  const handleAuthSuccess = useCallback(async (code: string) => {
    setServerError('')
    setValue('code', code)
    trackGtmEvent('auth_code_submitted', {
      event_category: 'auth',
      event_label: 'code_submitted',
      event_description: 'Código de autenticação enviado com sucesso.',
    })

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
        complement,
        registration_number: registrationNumber,
        notary,
        lot_name: allotment,
        block_number: block,
        lot_number: lot
      })

      setStep('pix')
    } catch {
    } finally {
      setIsAuthLoading(false)
    }
  }, [setValue, getValues, placeId, generatePix, documentId, complement, registrationNumber, notary, allotment, block, lot])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixData?.payload || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      trackGtmEvent('pix_copied', {
        event_category: 'payment',
        event_label: 'pix_copy',
        event_description: 'Código PIX copiado.',
        payment_method: 'pix',
        payment_id: paymentId,
      })

      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

      if (isDevMode) {
        setTimeout(() => {
          onFinish()
        }, 1500)
      }

    } catch (error) {
      console.error(error)
    }
  }, [pixData, onFinish, paymentId])

  useEffect(() => {
    if (step !== 'pix' || !pixData || hasTrackedPixView.current) return
    hasTrackedPixView.current = true
    trackGtmEvent('pix_view', {
      event_category: 'payment',
      event_label: 'pix_view',
      event_description: 'Tela do PIX exibida para pagamento.',
      payment_method: 'pix',
      payment_id: paymentId,
      expires_at: expirationTime,
    })
    trackGtmEvent('payment_pending', {
      event_category: 'payment',
      event_label: 'pending',
      event_description: 'Pagamento via PIX aguardando confirmação.',
      payment_method: 'pix',
      payment_id: paymentId,
    })
  }, [step, pixData, paymentId, expirationTime])

  const isLoading = isAuthLoading || isPixPending

  if (status === 'loading') {
    return <LoadingOverlay isLoading={true} message="Carregando..." />
  }

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col relative px-4 mt-6">
        {step === 'details' && (
          <BottomSheet isOpen={true} onClose={handleCloseBottomSheet} className="bg-white">
            <div className="p-6 pb-12 max-h-[85vh] overflow-y-auto flex flex-col gap-6">

              <div className="flex flex-row gap-3 items-center">
                <div className="p-2 bg-primary/5 rounded-xl">
                  <PixIcon className="size-7 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <TextTitle className="text-xl font-bold text-dark">Dados para o PIX</TextTitle>
                  <TextSubtitle className="text-gray-500">Informe seus dados para gerar o código</TextSubtitle>
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

                <div className="pt-2">
                  <Button 
                    type="button" 
                    onClick={handleDetailsSubmit} 
                    disabled={isLoading} 
                    className="rounded-xl h-12"
                    icon={<ChevronRight className="size-5" />}
                  >
                    {isLoading ? 'Processando...' : 'Gerar código PIX'}
                  </Button>
                </div>
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
          <div className="flex flex-col items-center pt-10 -mt-20">
            <div className="mb-8 text-white px-1 text-left relative z-10 w-full text-center flex flex-col gap-5">
              <p className="text-center leading-snug font-normal text-white/90">
                Realize o pagamento do valor <span className="font-bold text-white">R$ 59,00</span> para começar a consulta dos dados do endereço
              </p>

              <AddressSummaryCard
                address={getValues('address')}
                registrationNumber={getValues('registrationNumber')}
                allotment={getValues('allotment')}
                block={getValues('block')}
                lot={getValues('lot')}
              />
            </div>

            <div className="mx-auto mb-10 relative z-10 shadow-xl rounded-xl w-fit">
              <div className="bg-primary p-1.5 rounded-xl">
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
              <Button onClick={handleCopy} type="button" className="rounded-xl h-12">
                <div className="flex items-center justify-center gap-2">
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  <span>{copied ? 'Copiado!' : 'Copiar PIX'}</span>
                </div>
              </Button>

              {/* Aviso visual somente em Dev Mode (Opcional, mas ajuda muito) */}
              {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && step === 'pix' && (
                <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 text-xs rounded text-center border border-yellow-200">
                  🚧 <strong>Modo Dev Ativo:</strong> Ao copiar o código, o pagamento será aprovado automaticamente.
                </div>
              )}
            <div className="flex items-center gap-2 text-dark font-semibold text-sm py-4">
                <Clock size={18} className="animate-spin text-primary" />
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