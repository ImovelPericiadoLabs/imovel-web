import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DocumentItem from './document-item'

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

    expect(screen.getByTestId('icon-Image')).toBeInTheDocument()
    expect(screen.queryByTestId('icon-File')).not.toBeInTheDocument()
  })

  it('should render the file icon when document is not an image', () => {
    render(<DocumentItem document={mockDocumentFile} onRemove={() => {}} />)

    expect(screen.getByTestId('icon-File')).toBeInTheDocument()
    expect(screen.queryByTestId('icon-Image')).not.toBeInTheDocument()
  })

  it('should call onRemove when clicking the trash button', () => {
    const onRemoveMock = vi.fn()

    render(<DocumentItem document={mockDocumentFile} onRemove={onRemoveMock} />)

    const removeButton = screen.getByLabelText('Deletar documento')
    fireEvent.click(removeButton)

    expect(onRemoveMock).toHaveBeenCalledTimes(1)
  })

  it('should not crash when mime type is missing', () => {
    render(
      <DocumentItem
        document={{ id: '3', name: 'foto.jpg', size: 1, type: '' }}
        onRemove={() => {}}
      />,
    )

    expect(screen.getByText('foto.jpg')).toBeInTheDocument()
    expect(screen.getByTestId('icon-File')).toBeInTheDocument()
  })

  it('should render the trash icon', () => {
    render(<DocumentItem document={mockDocumentImage} onRemove={() => {}} />)

    expect(screen.getByTestId('icon-Trash')).toBeInTheDocument()
  })
})
