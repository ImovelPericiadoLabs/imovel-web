'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import {
  consultFlowHeroBlockClass,
  consultFlowHeroTitleClass,
  consultFlowHeroTitleSizePrimaryClass,
} from '@/constants/consult-flow-hero-text'
import { cn } from '@/utils/tailwind'
import DocumentUpload from '@/components/document-upload'
import { normalizeConsultDocumentFile } from '@/components/document-upload/accepted-document'
import DocumentItem from '@/components/document-item'
import Button from '@/components/button'
import Alert from '@/components/alert'
import LoadingOverlay from '@/components/loading-overlay'
import { uploadDocument } from '@/services/documents'

interface UploadedDocument {
  id: string
  name: string
  size: number
  file: File
  type: string
}

export function SendDocumentStep({ onNext }: { onNext: () => void }) {
  const { setValue, getValues, watch, formState, trigger, clearErrors, setError } = useFormContext()

  const [uploadProgress, setUploadProgress] = useState(0)
  const documentPreview = watch('documentPreview')
  const documentType: string = getValues('documentType')

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (file: File) => uploadDocument(file, documentType, setUploadProgress),
    onSuccess(data) {
      setValue('document', data, { shouldDirty: true })
    },
    onError() {
      setError('document', {
        message:
          'Não foi possível enviar o documento. Verifique se o mesmo possui no máximo 250 MB e está em um dos formatos permitidos (imagens, PDF ou documentos Word).',
      })
    },
  })

  async function handleFileSelect(file: File) {
    clearErrors('document')

    const uploadFile = normalizeConsultDocumentFile(file)
    const sizeMB = Math.round((uploadFile.size / (1024 * 1024)) * 10) / 10
    const newDoc: UploadedDocument = {
      id: Date.now().toString(),
      name: uploadFile.name,
      size: sizeMB,
      file: uploadFile,
      type: uploadFile.type,
    }

    setValue('documentPreview', newDoc)
    await mutateAsync(uploadFile)
  }

  function handleRemoveDocument() {
    setValue('documentPreview', undefined)
    setValue('document', undefined)
    clearErrors('document')
  }

  async function handleContinue() {
    const uploaded = getValues('document') as { id?: string } | undefined
    const isValid = await trigger('document')
    if (isValid || uploaded?.id) onNext()
  }

  return (
    <div className="relative flex flex-col gap-5 px-4">
      <div className={consultFlowHeroBlockClass}>
        <TextTitle className={cn(consultFlowHeroTitleClass, consultFlowHeroTitleSizePrimaryClass)}>
          Envie o documento
        </TextTitle>
      </div>

      <DocumentUpload onFileSelect={handleFileSelect} />

      {!!documentPreview && (
        <DocumentItem document={documentPreview} onRemove={handleRemoveDocument} />
      )}

      {formState.errors?.document?.message && (
        <Alert variant="error" message={formState.errors.document.message as string} />
      )}

      {!!documentPreview && (
        <div className="mt-32">
          <Button
            disabled={isPending || !!formState.errors?.document?.message}
            onClick={handleContinue}
          >
            Continuar
          </Button>
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
