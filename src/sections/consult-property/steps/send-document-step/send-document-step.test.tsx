import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SendDocumentStep } from './send-document-step'

const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()
const watchMock = vi.fn()

vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    handleNextStep: handleNextStepMock,
    watch: watchMock,
  }),
}))

vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

vi.mock('@/components/document-upload', () => ({
  __esModule: true,
  default: ({ onFileSelect }: { onFileSelect: (file: File) => void }) => (
    <button
      data-testid="upload-trigger"
      onClick={() => onFileSelect(new File(['a'], 'doc.pdf', { type: 'application/pdf' }))}
    >
      Upload
    </button>
  ),
}))

vi.mock('@/components/document-item', () => ({
  __esModule: true,
  default: ({ onRemove }: { onRemove: () => void }) => (
    <div data-testid="document-item">
      <button data-testid="remove-doc" onClick={onRemove}>
        remove
      </button>
    </div>
  ),
}))

vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="continue-button" onClick={onClick}>
      Continuar
    </button>
  ),
}))

describe('SendDocumentStep', () => {
  it('should render the title correctly', () => {
    watchMock.mockReturnValue(null)

    render(<SendDocumentStep />)

    expect(screen.getByTestId('text-title')).toHaveTextContent('Envie o documento')
  })

  it('should render DocumentUpload', () => {
    watchMock.mockReturnValue(null)

    render(<SendDocumentStep />)

    expect(screen.getByTestId('upload-trigger')).toBeInTheDocument()
  })

  it('should call setValue with a new document when uploading', () => {
    watchMock.mockReturnValue(null)

    render(<SendDocumentStep />)

    const uploadButton = screen.getByTestId('upload-trigger')
    fireEvent.click(uploadButton)

    expect(setValueMock).toHaveBeenCalled()
    const call = setValueMock.mock.calls[0]

    expect(call[0]).toBe('document')
    expect(call[1]).toMatchObject({
      name: 'doc.pdf',
      type: 'application/pdf',
      size: expect.any(Number),
      file: expect.any(File),
    })
  })

  it('should render DocumentItem when document exists', () => {
    watchMock.mockReturnValue({
      id: '1',
      name: 'file.pdf',
      size: 1,
      type: 'application/pdf',
      file: new File(['a'], 'file.pdf'),
    })

    render(<SendDocumentStep />)

    expect(screen.getByTestId('document-item')).toBeInTheDocument()
  })

  it('should remove the document when clicking remove', () => {
    watchMock.mockReturnValue({
      id: '1',
      name: 'file.pdf',
      size: 1,
      type: 'application/pdf',
      file: new File(['a'], 'file.pdf'),
    })

    render(<SendDocumentStep />)

    const removeBtn = screen.getByTestId('remove-doc')
    fireEvent.click(removeBtn)

    expect(setValueMock).toHaveBeenCalledWith('document', null)
  })

  it('should call handleNextStep when clicking continue', () => {
    watchMock.mockReturnValue({
      id: '1',
      name: 'file.pdf',
      size: 1,
      type: 'application/pdf',
      file: new File(['a'], 'file.pdf'),
    })

    render(<SendDocumentStep />)

    const continueBtn = screen.getByTestId('continue-button')
    fireEvent.click(continueBtn)

    expect(handleNextStepMock).toHaveBeenCalledTimes(1)
  })
})
