import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DocumentUpload from './document-upload'

describe('DocumentUpload', () => {
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createFile = (name: string, type: string, size: number): File => {
    const file = new File([], name, { type })
    Object.defineProperty(file, 'size', {
      value: size,
      writable: false,
    })
    return file
  }

  const validPdfFile = createFile('document.pdf', 'application/pdf', 1024)
  const validJpgEmptyMime = createFile('matricula.jpg', '', 1024)
  const validPngFile = createFile('matricula.png', 'image/png', 1024)
  const invalidTypeFile = createFile('script.js', 'text/javascript', 1024)
  const oversizedFile = createFile('large.png', 'image/png', 251 * 1024 * 1024)

  it('should render the component with initial text and icon', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)

    expect(screen.getByTestId('icon-CloudUpload')).toBeInTheDocument()
    expect(screen.getByText('Carregue o documento')).toBeInTheDocument()
    expect(screen.getByText(/Aceitamos \(PDF, imagem ou word, até 250 MB\)\./)).toBeInTheDocument()

    expect(screen.getByTestId('file-input')).toHaveClass('hidden')
  })

  it('should trigger file input click when the component area is clicked', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const fileInput = screen.getByTestId('file-input')
    const clickSpy = vi.spyOn(fileInput, 'click')

    const uploadArea = screen.getByText('Carregue o documento').parentElement!
    fireEvent.click(uploadArea)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('should call onFileSelect with a valid file when selected via file input', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const fileInput = screen.getByTestId('file-input')

    fireEvent.change(fileInput, { target: { files: [validPdfFile] } })

    expect(mockOnFileSelect).toHaveBeenCalledTimes(1)
    expect(mockOnFileSelect).toHaveBeenCalledWith(validPdfFile)
  })

  it('should call onFileSelect with a jpg even when mime type is empty', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const fileInput = screen.getByTestId('file-input')

    fireEvent.change(fileInput, { target: { files: [validJpgEmptyMime] } })

    expect(mockOnFileSelect).toHaveBeenCalledTimes(1)
    expect(mockOnFileSelect.mock.calls[0][0].name).toBe('matricula.jpg')
    expect(mockOnFileSelect.mock.calls[0][0].type).toBe('image/jpeg')
  })

  it('should call onFileSelect with a png image', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const fileInput = screen.getByTestId('file-input')

    fireEvent.change(fileInput, { target: { files: [validPngFile] } })

    expect(mockOnFileSelect).toHaveBeenCalledTimes(1)
    expect(mockOnFileSelect).toHaveBeenCalledWith(validPngFile)
  })

  it('should not call onFileSelect when an invalid file type is selected', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const fileInput = screen.getByTestId('file-input')

    fireEvent.change(fileInput, { target: { files: [invalidTypeFile] } })

    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('should not call onFileSelect when a file larger than 250MB is selected', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const fileInput = screen.getByTestId('file-input')

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('should clear the file input value after a file is selected', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [validPdfFile] } })

    expect(fileInput.value).toBe('')
  })

  it('should apply dragging styles on drag over', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const uploadArea = screen.getByText('Carregue o documento').parentElement!

    fireEvent.dragOver(uploadArea, {
      dataTransfer: { files: [validPdfFile] },
    })

    expect(uploadArea).toHaveClass('border-primary border-dashed bg-purple-50')
  })

  it('should remove dragging styles on drag leave', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const uploadArea = screen.getByText('Carregue o documento').parentElement!

    fireEvent.dragOver(uploadArea, {
      dataTransfer: { files: [validPdfFile] },
    })
    expect(uploadArea).toHaveClass('border-primary border-dashed bg-purple-50')

    fireEvent.dragLeave(uploadArea)
    expect(uploadArea).not.toHaveClass('border-primary border-dashed bg-purple-50')
  })

  it('should call onFileSelect with a valid file on drop', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const uploadArea = screen.getByText('Carregue o documento').parentElement!

    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [validPdfFile] },
    })

    expect(mockOnFileSelect).toHaveBeenCalledTimes(1)
    expect(mockOnFileSelect).toHaveBeenCalledWith(validPdfFile)
  })

  it('should not call onFileSelect with an invalid file type on drop', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const uploadArea = screen.getByText('Carregue o documento').parentElement!

    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [invalidTypeFile] },
    })

    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('should not call onFileSelect with an oversized file on drop', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const uploadArea = screen.getByText('Carregue o documento').parentElement!

    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [oversizedFile] },
    })

    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('should remove dragging styles on drop', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const uploadArea = screen.getByText('Carregue o documento').parentElement!

    fireEvent.dragOver(uploadArea, {
      dataTransfer: { files: [validPdfFile] },
    })
    expect(uploadArea).toHaveClass('border-primary border-dashed bg-purple-50')

    fireEvent.drop(uploadArea, {
      dataTransfer: { files: [validPdfFile] },
    })
    expect(uploadArea).not.toHaveClass('border-primary border-dashed bg-purple-50')
  })

  it('should prevent default behavior for dragOver and drop events', () => {
    render(<DocumentUpload onFileSelect={mockOnFileSelect} />)
    const uploadArea = screen.getByText('Carregue o documento').parentElement!

    const dragOverEvent = new Event('dragover', { bubbles: true })
    const preventDefaultSpyDrag = vi.spyOn(dragOverEvent, 'preventDefault')
    fireEvent(uploadArea, dragOverEvent)
    expect(preventDefaultSpyDrag).toHaveBeenCalledTimes(1)

    const dropEvent = new Event('drop', { bubbles: true })
    const preventDefaultSpyDrop = vi.spyOn(dropEvent, 'preventDefault')
    fireEvent(uploadArea, dropEvent)
    expect(preventDefaultSpyDrop).toHaveBeenCalledTimes(1)
  })
})
