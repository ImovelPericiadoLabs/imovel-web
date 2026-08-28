import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PrintLayoutPreview from './print-layout-preview'

describe('PrintLayoutPreview', () => {
  it('explica duplex na borda longa', () => {
    render(
      <PrintLayoutPreview
        config={{ layout: 'duplex', duplex: 'long-edge', verso: 'fold' }}
      />,
    )
    expect(screen.getByText(/virada na borda longa/i)).toBeInTheDocument()
  })

  it('explica empilhado com dobra', () => {
    render(
      <PrintLayoutPreview
        config={{ layout: 'stacked', duplex: 'long-edge', verso: 'fold' }}
      />,
    )
    expect(screen.getByText(/Empilhado · dobra/i)).toBeInTheDocument()
  })

  it('explica empilhado junto como panfleto', () => {
    render(
      <PrintLayoutPreview
        config={{ layout: 'stacked', duplex: 'long-edge', verso: 'join' }}
      />,
    )
    expect(screen.getByText(/Empilhado · junto/i)).toBeInTheDocument()
    expect(screen.getByText(/Panfleto/i)).toBeInTheDocument()
  })
})
