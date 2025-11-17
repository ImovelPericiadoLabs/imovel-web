import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useFormContext, FieldError } from 'react-hook-form'
import { MutationFunctionContext, useMutation, UseMutationOptions } from '@tanstack/react-query'
import { uploadDocument } from '@/services/documents'
import { SendDocumentStep } from './send-document-step'

interface UploadedDocument {
  id: string
  name: string
  size: number
  file: File
  type: string
}

vi.mock('@/services/documents', () => ({
  uploadDocument: vi.fn(),
}))

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
const mockUploadDocument = uploadDocument as Mock<
  (file: File, progress: (n: number) => void) => Promise<unknown>
>

describe('SendDocumentStep', () => {
  let mockHandleNextStep: Mock<() => void>
  let mockSetValue: Mock<(name: string, value: unknown) => void>
  let mockWatch: Mock<(name: string) => UploadedDocument | undefined>
  let mockTrigger: Mock<(name: string) => Promise<boolean>>
  let mockClearErrors: Mock<(name: string) => void>
  let mockSetError: Mock<(name: string, error: FieldError) => void>

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
          const result = await options.mutationFn?.(file, {} as MutationFunctionContext)
          options.onSuccess?.(result, file, {}, {} as MutationFunctionContext)
          return result
        } catch (error) {
          options.onError?.(error as Error, file, {}, {} as MutationFunctionContext)
          throw error
        }
      },
      isPending: false,
    }))

    mockWatch.mockReturnValue(undefined)
    mockUploadDocument.mockReset()
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
    mockUploadDocument.mockResolvedValue({ ok: true })

    render(<SendDocumentStep />)

    fireEvent.click(screen.getByText('Select File'))

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('document', { ok: true })
    })

    expect(mockSetValue).toHaveBeenCalledWith(
      'documentPreview',
      expect.objectContaining({ name: 'test.pdf' }),
    )
  })

  it('should call onError and set error message when uploadDocument fails', async () => {
    const errorMessage =
      'Ocorreu um erro aotentar fazer o upload do arquivo! Favor tete mais tarde.'

    mockUseFormContext.mockReturnValue({
      handleNextStep: mockHandleNextStep,
      setValue: mockSetValue,
      watch: vi.fn().mockReturnValue(mockDocument),
      formState: { errors: { document: { message: errorMessage } } },
      trigger: mockTrigger,
      clearErrors: mockClearErrors,
      setError: mockSetError,
    })

    mockUploadDocument.mockRejectedValue(new Error('upload failed'))

    mockWatch.mockReturnValue(undefined)

    render(<SendDocumentStep />)

    fireEvent.click(screen.getByText('Select File'))

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('document', {
        message: errorMessage,
      })
    })

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    expect(screen.getByText('Continuar')).toBeDisabled()
  })

  it('should remove the document when onRemove is called', () => {
    mockWatch.mockReturnValue(mockDocument)

    render(<SendDocumentStep />)

    fireEvent.click(screen.getByText('Remove'))

    expect(mockSetValue).toHaveBeenCalledWith('documentPreview', undefined)
    expect(mockSetValue).toHaveBeenCalledWith('document', undefined)
    expect(mockClearErrors).toHaveBeenCalledWith('document')
  })

  it('should call handleNextStep when continue is clicked and form is valid', async () => {
    mockWatch.mockReturnValue(mockDocument)
    mockTrigger.mockResolvedValue(true)

    render(<SendDocumentStep />)

    fireEvent.click(screen.getByText('Continuar'))

    await waitFor(() => {
      expect(mockHandleNextStep).toHaveBeenCalled()
    })
  })

  it('should not call handleNextStep when form is invalid', async () => {
    mockWatch.mockReturnValue(mockDocument)
    mockTrigger.mockResolvedValue(false)

    render(<SendDocumentStep />)
    fireEvent.click(screen.getByText('Continuar'))

    await waitFor(() => {
      expect(mockHandleNextStep).not.toHaveBeenCalled()
    })
  })

  it('should show loading overlay while uploading', () => {
    mockUseMutation.mockImplementation(() => ({
      mutateAsync: async () => undefined,
      isPending: true,
    }))

    render(<SendDocumentStep />)

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })

  it('should call uploadDocument with file and progress callback inside mutationFn', async () => {
    mockUploadDocument.mockResolvedValue({ ok: true })

    render(<SendDocumentStep />)

    fireEvent.click(screen.getByText('Select File'))

    await waitFor(() => {
      expect(mockUploadDocument).toHaveBeenCalledTimes(1)
    })

    const [calledFile, progressFn] = mockUploadDocument.mock.calls[0]

    expect(calledFile).toBeInstanceOf(File)
    expect(typeof progressFn).toBe('function')
  })
})
