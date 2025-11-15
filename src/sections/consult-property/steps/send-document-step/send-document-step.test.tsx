import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useFormContext, FieldError } from 'react-hook-form'
import { MutationFunctionContext, useMutation, UseMutationOptions } from '@tanstack/react-query'
import { SendDocumentStep } from './send-document-step'

interface UploadedDocument {
  id: string
  name: string
  size: number
  file: File
  type: string
}

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}))

vi.mock('@/components/text-title', () => ({
  default: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}))

vi.mock('@/components/document-upload', () => ({
  default: ({ onFileSelect }: { onFileSelect: (file: File) => void }) => (
    <div data-testid="document-upload">
      <button onClick={() => onFileSelect(new File([''], 'test.pdf', { type: 'application/pdf' }))}>
        Select File
      </button>
    </div>
  ),
}))

vi.mock('@/components/document-item', () => ({
  default: ({ document, onRemove }: { document: UploadedDocument; onRemove: () => void }) => (
    <div data-testid="document-item">
      <span>{document.name}</span>
      <button onClick={onRemove}>Remove</button>
    </div>
  ),
}))

vi.mock('@/components/button', () => ({
  default: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/alert', () => ({
  default: ({ message }: { message: string }) => <div role="alert">{message}</div>,
}))

vi.mock('@/components/loading-overlay', () => ({
  default: ({ isLoading, message }: { isLoading: boolean; message: string }) =>
    isLoading ? <div data-testid="loading-overlay">{message}</div> : null,
}))

const mockUseFormContext = useFormContext as Mock
const mockUseMutation = useMutation as Mock

describe('SendDocumentStep', () => {
  let mockHandleNextStep: Mock<() => void>
  let mockSetValue: Mock<(name: string, value: unknown) => void>
  let mockWatch: Mock<(name: string) => UploadedDocument | undefined>
  let mockTrigger: Mock<(name: string) => Promise<boolean>>
  let mockClearErrors: Mock<(name: string) => void>
  let mockSetError: Mock<(name: string, error: FieldError) => void>
  let mockMutateAsync: Mock<(file: File) => Promise<unknown>>

  const mockDocument: UploadedDocument = {
    id: '12345',
    name: 'test.pdf',
    size: 0.1,
    file: new File([''], 'test.pdf'),
    type: 'application/pdf',
  }

  beforeEach(() => {
    mockHandleNextStep = vi.fn()
    mockSetValue = vi.fn()
    mockWatch = vi.fn()
    mockTrigger = vi.fn()
    mockClearErrors = vi.fn()
    mockSetError = vi.fn()
    mockMutateAsync = vi.fn()

    mockUseFormContext.mockReturnValue({
      handleNextStep: mockHandleNextStep,
      setValue: mockSetValue,
      watch: mockWatch,
      formState: { errors: {} },
      trigger: mockTrigger,
      clearErrors: mockClearErrors,
      setError: mockSetError,
    })

    mockUseMutation.mockImplementation((options: UseMutationOptions<unknown, Error, File>) => ({
      mutateAsync: async (file: File) => {
        try {
          const data = await mockMutateAsync(file)
          if (options.onSuccess) {
            options.onSuccess(data, file, {}, {} as MutationFunctionContext)
          }
          return data
        } catch (error) {
          if (options.onError) {
            options.onError(error as Error, file, {}, {} as MutationFunctionContext)
          }
        }
      },
      isPending: false,
    }))

    mockWatch.mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render the initial state correctly', () => {
    render(<SendDocumentStep />)
    expect(screen.getByText('Envie o documento')).toBeInTheDocument()
    expect(screen.getByTestId('document-upload')).toBeInTheDocument()
    expect(screen.queryByTestId('document-item')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Continuar')).not.toBeInTheDocument()
  })

  it('should handle file selection and successful upload', async () => {
    const uploadedData = { id: 'doc-123', url: 'http://example.com/test.pdf' }
    mockMutateAsync.mockResolvedValue(uploadedData)

    render(<SendDocumentStep />)
    const fileSelectButton = screen.getByText('Select File')
    fireEvent.click(fileSelectButton)

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('document', uploadedData)
    })

    expect(mockSetValue).toHaveBeenCalledWith('documentPreview', expect.any(Object))
    expect(mockSetValue).toHaveBeenCalledTimes(2)
  })

  it('should handle file selection and a failed upload', async () => {
    const errorMessage =
      'Ocorreu um erro aotentar fazer o upload do arquivo! Favor tete mais tarde.'
    mockMutateAsync.mockRejectedValue(new Error('Upload failed'))

    mockUseFormContext.mockReturnValue({
      handleNextStep: mockHandleNextStep,
      setValue: mockSetValue,
      watch: vi.fn().mockReturnValue(mockDocument),
      formState: { errors: { document: { message: errorMessage } } },
      trigger: mockTrigger,
      clearErrors: mockClearErrors,
      setError: mockSetError,
    })

    render(<SendDocumentStep />)
    const fileSelectButton = screen.getByText('Select File')
    fireEvent.click(fileSelectButton)

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('document', { message: errorMessage })
    })

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
    const continueButton = screen.getByText('Continuar')
    expect(continueButton).toBeDisabled()
  })

  it('should remove the document when onRemove is called', () => {
    mockWatch.mockReturnValue(mockDocument)
    render(<SendDocumentStep />)
    expect(screen.getByTestId('document-item')).toBeInTheDocument()
    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)
    expect(mockSetValue).toHaveBeenCalledWith('documentPreview', undefined)
    expect(mockSetValue).toHaveBeenCalledWith('document', undefined)
    expect(mockClearErrors).toHaveBeenCalledWith('document')
  })

  it('should call handleNextStep when continue is clicked and form is valid', async () => {
    mockWatch.mockReturnValue(mockDocument)
    mockTrigger.mockResolvedValue(true)
    render(<SendDocumentStep />)
    const continueButton = screen.getByText('Continuar')
    fireEvent.click(continueButton)
    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith('document')
      expect(mockHandleNextStep).toHaveBeenCalled()
    })
  })

  it('should not call handleNextStep when continue is clicked and form is invalid', async () => {
    mockWatch.mockReturnValue(mockDocument)
    mockTrigger.mockResolvedValue(false)
    render(<SendDocumentStep />)
    const continueButton = screen.getByText('Continuar')
    fireEvent.click(continueButton)
    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith('document')
    })
    expect(mockHandleNextStep).not.toHaveBeenCalled()
  })

  it('should show loading overlay while uploading', () => {
    mockUseMutation.mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: true,
    }))
    render(<SendDocumentStep />)
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
    expect(screen.getByText('Fazendo o upload do documento')).toBeInTheDocument()
  })
})
