'use client'

import { useEffect, useState, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Check, FileText, Building, Scroll, LucideIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import DocumentItem from '@/components/document-item'
import Alert from '@/components/alert'
import LoadingOverlay from '@/components/loading-overlay'
import { uploadDocument } from '@/services/documents'
import SelectedAddressCard from '@/components/selected-address-card'

type DocumentType = 'agreement' | 'registration' | 'deed'

interface Option {
  id: DocumentType
  title: string
  subtitle: string
  icon: LucideIcon
}

const OPTIONS: Option[] = [
  {
    id: 'agreement',
    title: 'Contrato de compra e venda',
    subtitle: 'Acordo particular entre comprador e vendedor',
    icon: FileText,
  },
  {
    id: 'registration',
    title: 'Matrícula',
    subtitle: 'Documento principal do imóvel',
    icon: Building,
  },
  {
    id: 'deed',
    title: 'Escritura',
    subtitle: 'Escritura pública lavrada e feita por um cartório tabelião',
    icon: Scroll,
  },
]

export function DocumentTypeStep({ onNext }: { onNext: () => void }) {
  const { setValue, getValues, watch, formState, trigger, clearErrors, setError } = useFormContext()
  const documentType = watch('documentType')
  const documentPreview = watch('documentPreview')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (file: File) => uploadDocument(file, documentType, setUploadProgress),
    onSuccess(data) {
      setValue('document', data)
    },
    onError() {
      setError('document', {
        message:
          'Não foi possível enviar o documento. Verifique se o mesmo possui no máximo 250 MB e está em um dos formatos permitidos (imagens, PDF ou documentos Word).',
      })
    },
  })

  function handleSelect(value: DocumentType) {
    const isNewType = documentType !== value
    setValue('documentType', value, { shouldValidate: true })

    if (isNewType && documentPreview) {
      handleRemoveDocument()
    }

    if (!documentPreview || isNewType) {
      // Pequeno delay para garantir que o tipo de documento foi atualizado no estado antes de abrir o seletor de arquivos
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 100)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    // Validar arquivo antes de prosseguir
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const maxSize = 250 * 1024 * 1024

    if (!validTypes.includes(file.type)) {
      setError('document', { message: 'Formato de arquivo não suportado. Use PDF, Word ou Imagem.' })
      e.target.value = ''
      return
    }

    if (file.size > maxSize) {
      setError('document', { message: 'O arquivo é muito grande. O limite é 250 MB.' })
      e.target.value = ''
      return
    }

    clearErrors('document')

    const sizeMB = Math.round((file.size / (1024 * 1024)) * 10) / 10
    const newDoc = {
      id: Date.now().toString(),
      name: file.name,
      size: sizeMB,
      file,
      type: file.type,
    }

    setValue('documentPreview', newDoc)
    await mutateAsync(file)

    // Reset input value to allow selecting the same file again if needed
    e.target.value = ''
  }

  function handleRemoveDocument() {
    setValue('documentPreview', undefined)
    setValue('document', undefined)
    clearErrors('document')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleContinue() {
    const isValid = await trigger(['documentType', 'document'])
    if (isValid) onNext()
  }

  useEffect(() => {
    if (!documentType) {
      setValue('documentType', undefined)
    }
  }, [setValue, documentType])

  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return

    const handleCancel = () => {
      // Se não houver um documento já carregado (documentPreview), desmarca o tipo ao cancelar a seleção
      if (!watch('documentPreview')) {
        setValue('documentType', undefined)
      }
    }

    input.addEventListener('cancel', handleCancel)
    return () => input.removeEventListener('cancel', handleCancel)
  }, [setValue, watch])

  return (
    <div className="relative flex-1 px-4 -mt-6 pb-32">
      <div className="flex flex-col gap-5 pt-6">
        <SelectedAddressCard address={watch('address')} />
        <div className="flex flex-col gap-2">
          <TextTitle className="text-dark">Qual documento você tem?</TextTitle>
          <TextSubtitle className="text-gray-500">Selecione uma das opções abaixo e envie o arquivo</TextSubtitle>
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
          />
          {OPTIONS.map((option) => {
            const isSelected = documentType === option.id
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left
                  ${isSelected
                    ? 'bg-primary/5 border-primary shadow-sm shadow-primary/10'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary' : 'bg-gray-100'}`}>
                  <Icon className={`size-5 ${isSelected ? 'text-white' : 'text-gray-400'} stroke-[2.5px]`} />
                </div>
                <div className="flex flex-col flex-1">
                  <span className={`text-base font-semibold ${isSelected ? 'text-primary' : 'text-dark'}`}>{option.title}</span>
                  <span className="text-xs text-gray-500">{option.subtitle}</span>
                </div>
                {isSelected && (
                  <div className="size-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    <Check className="size-4 text-white stroke-[3px]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {documentType && (
          <div className="flex flex-col gap-4 mt-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="h-px bg-gray-100 w-full" />
            {!!documentPreview && (
              <DocumentItem document={documentPreview} onRemove={handleRemoveDocument} />
            )}

            {formState.errors?.document?.message && (
              <Alert variant="error" message={formState.errors.document.message as string} />
            )}
          </div>
        )}
      </div>

      {documentType && !!watch('document') && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pt-5 pb-7 bg-white mt-auto border-t border-gray-100 z-10">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-primary hover:opacity-90 active:opacity-100 text-white font-semibold text-base h-12 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            Continuar para o resumo
          </button>
        </div>
      )}

      <LoadingOverlay
        isLoading={isPending}
        progress={uploadProgress}
        message="Fazendo o upload do documento"
      />
    </div>
  )
}
