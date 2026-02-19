'use client'

import { useState, useRef } from 'react'
import { CloudUpload } from 'lucide-react'

interface DocumentUploadAreaProps {
  onFileSelect: (file: File) => void
}

export default function DocumentUpload({ onFileSelect }: DocumentUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e?.dataTransfer?.files[0]
    if (file && isValidFile(file)) {
      onFileSelect(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file && isValidFile(file)) {
      onFileSelect(file)
    }

    e.currentTarget.value = ''
  }

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const maxSize = 250 * 1024 * 1024
    return validTypes.includes(file.type) && file.size <= maxSize
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-primary border-dashed bg-purple-50'
          : 'border-gray-200 bg-white hover:border-primary'
      }`}
    >
      <input
        data-testid="file-input"
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
      />

      <CloudUpload className="size-5 text-primary mx-auto mb-5" />

      <h2 className="text-sm font-semibold leading-5 text-primary mb-2">Carregue o documento</h2>

      <p className="text-gray-600 text-xs font-normal leading-4.5">
        Aceitamos (PDF, imagem ou word, até 250 MB).
      </p>
    </div>
  )
}
