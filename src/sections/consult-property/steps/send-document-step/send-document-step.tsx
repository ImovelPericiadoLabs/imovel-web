import { useFormContext } from 'react-hook-form'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import TextTitle from '@/components/text-title'
import DocumentUpload from '@/components/document-upload'
import DocumentItem from '@/components/document-item'
import Button from '@/components/button'

interface UploadedDocument {
  id: string
  name: string
  size: number
  file: File
  type: string
}

export function SendDocumentStep() {
  const { handleNextStep, setValue, watch } = useFormContext() as FormContextWithSteps

  const document = watch('document')

  async function handleFileSelect(file: File) {
    const sizeMB = Math.round((file.size / (1024 * 1024)) * 10) / 10
    const newDoc: UploadedDocument = {
      id: Date.now().toString(),
      name: file.name,
      size: sizeMB,
      file,
      type: file.type,
    }

    setValue('document', newDoc)
  }

  function handleRemoveDocument() {
    setValue('document', null)
  }

  return (
    <div className="flex flex-col h-full gap-5 px-4">
      <TextTitle>Envie o documento</TextTitle>

      <DocumentUpload onFileSelect={handleFileSelect} />

      {!!document && <DocumentItem document={document} onRemove={handleRemoveDocument} />}

      {!!document && (
        <div className="mt-32">
          <Button onClick={handleNextStep}>Continuar</Button>
        </div>
      )}
    </div>
  )
}
