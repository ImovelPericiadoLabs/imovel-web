'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Clock, Copy, IdCard, Mail, Phone, User, Wallet } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import BottomSheet from '@/components/bottom-sheet'
import LoadingOverlay from '@/components/loading-overlay'
import PixIcon from '@/components/icons/pix-icon'
import Alert from '@/components/alert'
import AddressSummaryCard from '@/components/address-summary-card'

import { processPayment, getPaymentStatus, type ProcessPaymentResult } from '@/services/payments'
import { getMe, startAuth } from '@/services/account'
import { listPlans } from '@/services/orders/orders'
import { ApiError } from '@/utils/api/errors'
import { queryKey } from '@/constants/queries'
import { validations, FormTypes } from './validations'
import type { FormTypes as ConsultFormTypes } from '@/sections/consult-property/validations'

function hasParentConsultContext(
  parentForm: { getValues: (n: keyof ConsultFormTypes | string) => unknown } | null | undefined,
  finalPlaceId: string,
) {
  if (String(finalPlaceId || '').trim().length > 0) return true
  if (!parentForm?.getValues) return false
  const hint = String(parentForm.getValues('addressHint') || '').trim()
  const doc = parentForm.getValues('document') as { id?: string } | null | undefined
  const hasDoc = Boolean(doc?.id)
  const reg = String(parentForm.getValues('registrationNumber') || '').trim()
  const notaryManual = String(parentForm.getValues('notaryName') || '').trim()
  const registry = parentForm.getValues('registry') as { name?: string } | null | undefined
  const registryName = String(registry?.name || '').trim()
  const notary = (notaryManual || registryName).trim()
  return hasDoc || hint.length >= 10 || (reg.length >= 1 && notary.length >= 3)
}
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
type MaskType = 'cpf' | 'whatsapp' | ((value: string) => string)

function pixPayloadFromResult(data: ProcessPaymentResult | undefined): string {
  if (!data) return ''
  if ('paid_with_credits' in data && data.paid_with_credits) return ''
  return 'payload' in data ? (data.payload ?? '') : ''
}

function applyMask(value: string, mask?: MaskType): string {
  const digits = value.replace(/\D/g, '')

  if (!mask) return value

  if (typeof mask === 'function') return mask(value)

  switch (mask) {
    case 'cpf':
      return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
        .slice(0, 14)

    case 'whatsapp':
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15)
  }
}

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
      const notaryName =
        String(parentForm?.getValues('notaryName') || '').trim() ||
        String(parentForm?.getValues('registry')?.name || '').trim() ||
        undefined
      const rawAllotment = parentForm?.getValues('allotment')
      const rawBlock = parentForm?.getValues('block')
      const rawLot = parentForm?.getValues('lot')

      return {
        complement: rawComplement?.trim() || undefined,
        registrationNumber: rawRegistrationNumber?.trim() || undefined,
        notary: notaryName || undefined,
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
  /** Após login por e-mail, segue para débito em créditos em vez de gerar PIX. */
  const paymentIntentRef = useRef<'credits' | null>(null)

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
  const nameField = register('name')
  const documentField = register('document')
  const emailField = register('email')
  const whatsappField = register('whatsapp')

  // Unificamos os métodos de pegar valores para usar o formulário pai nos campos de endereço
  const getValues = useCallback((field?: string) => {
    const parentFields = [
      'address',
      'addressHint',
      'placeId',
      'registrationNumber',
      'notaryName',
      'registry',
      'allotment',
      'block',
      'lot',
      'complement',
    ]
    if (field && parentFields.includes(field)) {
      return parentForm?.getValues(field as keyof FormTypes)
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

  const { data: meSnapshot } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: status === 'authenticated',
  })

  const { data: plansSnapshot } = useQuery({
    queryKey: ['plans'],
    queryFn: listPlans,
    enabled: status === 'authenticated',
  })

  const planPriceFromApi = useMemo(() => {
    const arr = Array.isArray(plansSnapshot) ? plansSnapshot : []
    const p = arr[0]?.price
    return typeof p === 'number' ? p : CONSULT_PRODUCT_PRICE
  }, [plansSnapshot])

  const creditsForUi = Number(meSnapshot?.credits_balance ?? 0)
  const showCreditsOption =
    status !== 'loading' &&
    (status !== 'authenticated' || creditsForUi >= planPriceFromApi)

  const buildPaymentPayload = useCallback(
    (
      formData: { name: string; document: string; email: string; whatsapp: string },
      finalPlaceId: string,
      whatsappClean: string,
    ) => {
      const hint = String(parentForm?.getValues('addressHint') || '').trim()
      return {
        place_id: finalPlaceId,
        ...(hint.length > 0 ? { address_hint: hint } : {}),
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
        lot_number: lot,
      }
    },
    [parentForm, documentId, complement, registrationNumber, notary, allotment, block, lot],
  )

  const attemptPayWithCredits = useCallback(
    async (
      formData: { name: string; document: string; email: string; whatsapp: string },
      finalPlaceId: string,
      whatsappClean: string,
    ) => {
      const [me, plans] = await Promise.all([getMe(), listPlans()])
      const arr = Array.isArray(plans) ? plans : []
      const price = typeof arr[0]?.price === 'number' ? arr[0].price : CONSULT_PRODUCT_PRICE
      const bal = Number(me?.credits_balance ?? 0)
      if (bal < price) {
        return false
      }

      await processPayment(
        { ...buildPaymentPayload(formData, finalPlaceId, whatsappClean), use_credits: true },
        {
          idempotencyKey:
            typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
              ? globalThis.crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`,
        },
      )
      return true
    },
    [buildPaymentPayload],
  )

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
    mutationFn: (data: Parameters<typeof processPayment>[0]) =>
      processPayment(data, {
        idempotencyKey:
          typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
      }),
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

  const handlePayWithCreditsClick = useCallback(async () => {
    const isValid = await trigger(['name', 'document', 'email', 'whatsapp'])
    if (!isValid) return

    const formData = getValues()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: formData.name,
      document: formData.document,
      email: formData.email,
      whatsapp: formData.whatsapp,
    }))

    const finalPlaceId = String(formData.placeId || placeId || '').trim()
    if (!hasParentConsultContext(parentForm, finalPlaceId)) {
      setServerError(
        'Selecione o endereço na busca, descreva o local (mínimo 10 caracteres), informe matrícula e cartório ou envie o documento do imóvel.',
      )
      return
    }

    trackGtmEvent('add_payment_info', {
      event_category: 'payment',
      event_label: 'credits_choice',
      event_description: 'Usuário optou por pagamento com créditos.',
      payment_type: 'credits',
      place_id: finalPlaceId || undefined,
      has_document: Boolean(documentId),
      currency: DEFAULT_CURRENCY,
      value: planPriceFromApi,
      items: [buildConsultItem(planPriceFromApi)],
    })

    clearServerError()
    const whatsappClean = formData.whatsapp.replace(/\D/g, '').slice(0, 12)

    if (status !== 'authenticated') {
      paymentIntentRef.current = 'credits'
      setIsAuthLoading(true)
      try {
        trackGtmEvent('auth_code_requested', {
          event_category: 'auth',
          event_label: 'new_login_credits',
          event_description: 'Código de autenticação para pagamento com créditos.',
          has_email: Boolean(formData.email),
        })
        await startAuth({ email: formData.email })
        setStep('auth')
      } catch {
        paymentIntentRef.current = null
        setServerError('Não foi possível enviar o código. Verifique o e-mail.')
      } finally {
        setIsAuthLoading(false)
      }
      return
    }

    setIsAuthLoading(true)
    try {
      const paid = await attemptPayWithCredits(formData, finalPlaceId, whatsappClean)
      if (!paid) {
        setServerError('Saldo insuficiente. Recarregue os créditos ou pague com PIX.')
        return
      }
      trackGtmEvent('purchase', {
        event_category: 'payment',
        event_label: 'purchase',
        event_description: 'Compra concluída com saldo em créditos.',
        payment_method: 'credits',
        currency: DEFAULT_CURRENCY,
        value: planPriceFromApi,
        items: [buildConsultItem(planPriceFromApi)],
      })
      onFinish()
    } catch (error) {
      const err = error as {
        code?: string
        detail?: string
        response?: { status: number }
        status?: number
      }
      const isUnauthorized =
        err?.code === 'token_not_valid' ||
        err?.detail === 'Given token not valid for any token type' ||
        err?.response?.status === 401 ||
        err?.status === 401

      if (isUnauthorized) {
        await signOut({ redirect: false })
        paymentIntentRef.current = 'credits'
        try {
          await startAuth({ email: formData.email })
          setStep('auth')
        } catch {
          setServerError('Sessão expirada. Verifique seu e-mail.')
          paymentIntentRef.current = null
        }
      } else {
        setServerError(
          error instanceof ApiError ? error.message : 'Erro ao processar pagamento com saldo. Tente novamente.',
        )
      }
    } finally {
      setIsAuthLoading(false)
    }
  }, [
    trigger,
    getValues,
    placeId,
    clearServerError,
    status,
    documentId,
    planPriceFromApi,
    attemptPayWithCredits,
    onFinish,
    parentForm,
  ])

  const handleDetailsSubmit = useCallback(async () => {
    paymentIntentRef.current = null
    const isValid = await trigger(['name', 'document', 'email', 'whatsapp'])

    if (!isValid) return

    const formData = getValues()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: formData.name,
      document: formData.document,
      email: formData.email,
      whatsapp: formData.whatsapp,
    }))

    const finalPlaceId = String(formData.placeId || placeId || '').trim()
    if (!hasParentConsultContext(parentForm, finalPlaceId)) {
      setServerError(
        'Selecione o endereço na busca, descreva o local (mínimo 10 caracteres), informe matrícula e cartório ou envie o documento do imóvel.',
      )
      return
    }

    trackGtmEvent('add_payment_info', {
      event_category: 'payment',
      event_label: 'pix_details',
      event_description: 'Dados para pagamento via PIX foram preenchidos.',
      payment_type: 'pix',
      place_id: finalPlaceId || undefined,
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
        await generatePix(buildPaymentPayload(formData, finalPlaceId, whatsappClean))
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
          setServerError(
            error instanceof ApiError ? error.message : 'Erro ao processar pagamento. Tente novamente.'
          )
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
  }, [
    trigger,
    getValues,
    placeId,
    clearServerError,
    status,
    generatePix,
    buildPaymentPayload,
    parentForm,
  ])

  const handleAuthSuccess = useCallback(async (code: string) => {
    setServerError('')
    setValue('code', code)
    trackGtmEvent('auth_code_submitted', {
      event_category: 'auth',
      event_label: 'code_submitted',
      event_description: 'Código de autenticação enviado com sucesso.',
    })

    const formData = getValues()
    const finalPlaceId = String(formData.placeId || placeId || '').trim()
    if (!hasParentConsultContext(parentForm, finalPlaceId)) {
      setServerError(
        'Selecione o endereço na busca, descreva o local (mínimo 10 caracteres), informe matrícula e cartório ou envie o documento do imóvel.',
      )
      return
    }

    setIsAuthLoading(true)

    const whatsappClean = formData.whatsapp.replace(/\D/g, '').slice(0, 12)
    const creditsIntent = paymentIntentRef.current
    paymentIntentRef.current = null

    if (creditsIntent === 'credits') {
      try {
        const paid = await attemptPayWithCredits(formData, finalPlaceId, whatsappClean)
        if (paid) {
          trackGtmEvent('purchase', {
            event_category: 'payment',
            event_label: 'purchase',
            event_description: 'Compra concluída com saldo em créditos.',
            payment_method: 'credits',
            currency: DEFAULT_CURRENCY,
            value: planPriceFromApi,
            items: [buildConsultItem(planPriceFromApi)],
          })
          onFinish()
          return
        }
        setServerError('Saldo insuficiente. Recarregue os créditos ou pague com PIX.')
        setStep('details')
      } catch (error) {
        if (error instanceof ApiError) {
          setServerError(error.message)
        } else {
          setServerError('Erro ao processar pagamento com saldo. Tente novamente.')
        }
        setStep('details')
      } finally {
        setIsAuthLoading(false)
      }
      return
    }

    try {
      await generatePix(buildPaymentPayload(formData, finalPlaceId, whatsappClean))

      setStep('pix')
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
      }
    } finally {
      setIsAuthLoading(false)
    }
  }, [
    setValue,
    getValues,
    placeId,
    generatePix,
    buildPaymentPayload,
    parentForm,
    attemptPayWithCredits,
    planPriceFromApi,
    onFinish,
  ])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixPayloadFromResult(pixData))
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
                <div className="flex flex-col gap-0.5">
                  <TextTitle className="text-lg font-semibold text-dark leading-tight">
                    Último passo para sua consulta do imóvel
                  </TextTitle>
                  <TextSubtitle className="text-sm text-gray-500 leading-snug">
                    {showCreditsOption
                      ? status === 'authenticated'
                        ? `Preencha os dados e escolha pagar com saldo ou PIX (R$ ${planPriceFromApi.toFixed(2).replace('.', ',')})`
                        : 'Preencha os dados: você pode usar o saldo da sua conta após confirmar o e-mail ou pagar com PIX'
                      : `Preencha seus dados para gerar o PIX de ${planPriceFromApi.toFixed(2).replace('.', ',')}`}
                  </TextSubtitle>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
                {!!serverError && <Alert variant="error" message={serverError} />}


                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1">
                    Nome completo
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                      <User className="size-5" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      placeholder="Ex: Roberto Silva"
                      {...nameField}
                      onKeyDown={clearServerError}
                      className={`
                        w-full 
                        pl-12 pr-4 py-4
                        bg-white 
                        border ${errors.name ? 'border-red-500' : 'border-gray-200'}
                        rounded-xl
                        text-sm text-gray-900 
                        placeholder:text-gray-400 
                        outline-none 
                        transition-all duration-200
                        focus:border-primary 
                        focus:ring-4 focus:ring-primary/10
                      `}
                    />
                  </div>
                  {errors.name?.message && (
                    <p className="text-xs text-red-500 ml-1">{errors.name.message as string}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="document" className="text-sm font-semibold text-gray-700 ml-1">
                    CPF (somente números)
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                      <IdCard className="size-5" />
                    </div>
                    <input
                      id="document"
                      type="text"
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      {...documentField}
                      onChange={(event) => {
                        event.target.value = applyMask(event.target.value, 'cpf')
                        documentField.onChange(event)
                      }}
                      onKeyDown={clearServerError}
                      className={`
                        w-full 
                        pl-12 pr-4 py-4
                        bg-white 
                        border ${errors.document ? 'border-red-500' : 'border-gray-200'}
                        rounded-xl
                        text-sm text-gray-900 
                        placeholder:text-gray-400 
                        outline-none 
                        transition-all duration-200
                        focus:border-primary 
                        focus:ring-4 focus:ring-primary/10
                      `}
                    />
                  </div>
                  {errors.document?.message && (
                    <p className="text-xs text-red-500 ml-1">{errors.document.message as string}</p>
                  )}
                </div>

                {status === 'authenticated' ? (
                  <input type="hidden" {...emailField} />
                ) : (
                  <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">
                    E-mail (para receber atualizações)
                  </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                        <Mail className="size-5" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        placeholder="email@email.com"
                        {...emailField}
                        onKeyDown={clearServerError}
                        className={`
                          w-full 
                          pl-12 pr-4 py-4
                          bg-white 
                          border ${errors.email ? 'border-red-500' : 'border-gray-200'}
                          rounded-xl
                          text-sm text-gray-900 
                          placeholder:text-gray-400 
                          outline-none 
                          transition-all duration-200
                          focus:border-primary 
                          focus:ring-4 focus:ring-primary/10
                        `}
                      />
                    </div>
                    {errors.email?.message && (
                      <p className="text-xs text-red-500 ml-1">{errors.email.message as string}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700 ml-1">
                    WhatsApp com DDD (para receber atualizações)
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                      <Phone className="size-5" />
                    </div>
                    <input
                      id="whatsapp"
                      type="text"
                      placeholder="(99) 99999-9999"
                      inputMode="numeric"
                      {...whatsappField}
                      onChange={(event) => {
                        event.target.value = applyMask(event.target.value, 'whatsapp')
                        whatsappField.onChange(event)
                      }}
                      onKeyDown={clearServerError}
                      className={`
                        w-full 
                        pl-12 pr-4 py-4
                        bg-white 
                        border ${errors.whatsapp ? 'border-red-500' : 'border-gray-200'}
                        rounded-xl
                        text-sm text-gray-900 
                        placeholder:text-gray-400 
                        outline-none 
                        transition-all duration-200
                        focus:border-primary 
                        focus:ring-4 focus:ring-primary/10
                      `}
                    />
                  </div>
                  {errors.whatsapp?.message && (
                    <p className="text-xs text-red-500 ml-1">{errors.whatsapp.message as string}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {showCreditsOption && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePayWithCreditsClick}
                      disabled={isLoading}
                      className="rounded-xl h-12"
                      icon={<Wallet className="size-5" />}
                    >
                      {isLoading
                        ? 'Processando...'
                        : status === 'authenticated'
                          ? `Pagar com saldo (R$ ${creditsForUi.toFixed(2).replace('.', ',')} disponíveis)`
                          : 'Pagar com saldo'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleDetailsSubmit}
                    disabled={isLoading}
                    className="rounded-xl h-12"
                    icon={<PixIcon className="size-5" />}
                  >
                    {isLoading ? 'Processando...' : 'Pagar com PIX'}
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

        {step === 'pix' && !!pixData && pixPayloadFromResult(pixData) !== '' && (
          <div className="flex flex-col items-center pt-10 -mt-20">
            <div className="mb-8 pt-4 text-black px-1 text-left relative z-10 w-full text-center flex flex-col gap-5">
              <p className="text-center leading-snug font-normal text-black/80">
                Realize o pagamento do valor <span className="font-bold text-black">R$ 59,00</span> para começar a consulta dos dados do endereço
              </p>

              <AddressSummaryCard
                address={String(getValues('address') || getValues('addressHint') || '').trim()}
                registrationNumber={getValues('registrationNumber')}
                notary={String(getValues('notaryName') || '').trim() || (parentForm?.getValues('registry') as { name?: string } | null | undefined)?.name?.trim() || undefined}
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
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixPayloadFromResult(pixData))}&margin=0`}
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
                <p className="text-[11px] text-gray-600 break-all font-mono text-center uppercase">
                  {pixPayloadFromResult(pixData)}
                </p>
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