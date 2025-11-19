import { useState } from 'react'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import { useFormContext } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import TextTitle from '@/components/text-title'
import DocumentUpload from '@/components/document-upload'
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

export function SendDocumentStep() {
  const { handleNextStep, setValue, watch, formState, trigger, clearErrors, setError } =
    useFormContext() as FormContextWithSteps
  const [uploadProgress, setUploadProgress] = useState(0)

  const documentPreview = watch('documentPreview')

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (file: File) => uploadDocument(file, setUploadProgress),
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

  async function handleFileSelect(file: File) {
    clearErrors('document')
    const sizeMB = Math.round((file.size / (1024 * 1024)) * 10) / 10
    const newDoc: UploadedDocument = {
      id: Date.now().toString(),
      name: file.name,
      size: sizeMB,
      file,
      type: file.type,
    }

    setValue('documentPreview', newDoc)

    await mutateAsync(file)
  }

  function handleRemoveDocument() {
    setValue('documentPreview', undefined)
    setValue('document', undefined)
    clearErrors('document')
  }

  async function handleContinue() {
    const isValid = await trigger('document')

    if (isValid) {
      handleNextStep()
    }
  }

  return (
    <div className="flex flex-col h-full gap-5 px-4">
      <TextTitle>Envie o documento</TextTitle>

      <DocumentUpload onFileSelect={handleFileSelect} />

      {!!documentPreview && (
        <DocumentItem document={documentPreview} onRemove={handleRemoveDocument} />
      )}

      {formState.errors?.document?.message && (
        <Alert variant="error" message={formState.errors?.document?.message as string} />
      )}

      {!!documentPreview && (
        <div className="mt-32">
          <Button disabled={!!formState.errors?.document?.message} onClick={handleContinue}>
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
