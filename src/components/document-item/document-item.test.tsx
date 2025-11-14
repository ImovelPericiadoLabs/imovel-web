import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DocumentItem from './document-item'

vi.mock('lucide-react', () => ({
  Image: ({ className }: { className: string }) => (
    <svg data-testid="image-icon" className={className} />
  ),
  File: ({ className }: { className: string }) => (
    <svg data-testid="file-icon" className={className} />
  ),
  Trash: () => <svg data-testid="trash-icon" />,
}))

const mockDocumentImage = {
  id: '1',
  name: 'foto.png',
  size: 2.5,
  type: 'image/png',
}

const mockDocumentFile = {
  id: '2',
  name: 'contrato.pdf',
  size: 1.2,
  type: 'application/pdf',
}

describe('DocumentItem', () => {
  it('should render the document name and size', () => {
    render(<DocumentItem document={mockDocumentImage} onRemove={() => {}} />)

    expect(screen.getByText('foto.png')).toBeInTheDocument()
    expect(screen.getByText('2.5 MB')).toBeInTheDocument()
  })

  it('should render the image icon when document is an image', () => {
    render(<DocumentItem document={mockDocumentImage} onRemove={() => {}} />)

    expect(screen.getByTestId('image-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('file-icon')).not.toBeInTheDocument()
  })

  it('should render the file icon when document is not an image', () => {
    render(<DocumentItem document={mockDocumentFile} onRemove={() => {}} />)

    expect(screen.getByTestId('file-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('image-icon')).not.toBeInTheDocument()
  })

  it('should call onRemove when clicking the trash button', () => {
    const onRemoveMock = vi.fn()

    render(<DocumentItem document={mockDocumentFile} onRemove={onRemoveMock} />)

    const removeButton = screen.getByLabelText('Deletar documento')
    fireEvent.click(removeButton)

    expect(onRemoveMock).toHaveBeenCalledTimes(1)
  })

  it('should render the trash icon', () => {
    render(<DocumentItem document={mockDocumentImage} onRemove={() => {}} />)

    expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
  })
})
