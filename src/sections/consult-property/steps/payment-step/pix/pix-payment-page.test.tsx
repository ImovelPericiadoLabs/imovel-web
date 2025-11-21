import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { PixPaymentPage } from './pix-payment-page'

describe('PixPaymentPage Component', () => {
  const mockWriteText = vi.fn()

  beforeEach(() => {
    // Mock do Clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    })
    mockWriteText.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('deve renderizar com os valores padrão', () => {
    render(<PixPaymentPage pixCode="teste123" />)
    
    // CORREÇÃO: Buscando textos que realmente existem no HTML fornecido
    expect(screen.getByText(/Aguardando o pagamento/i)).toBeInTheDocument()
    expect(screen.getByText(/via Pix para garantir/i)).toBeInTheDocument()
    
    // Verifica se o código do pix está visível na tela
    expect(screen.getByText('teste123')).toBeInTheDocument()
  })

  it('deve renderizar com props customizadas', () => {
    const customCode = "custom-code"
    render(<PixPaymentPage pixCode={customCode} />)

    // Verifica se o código customizado foi renderizado
    expect(screen.getByText(customCode)).toBeInTheDocument()
    
    // Verifica se o botão de copiar está presente
    expect(screen.getByRole('button', { name: /Copiar código pix/i })).toBeInTheDocument()
  })

  it('deve gerar a URL correta para o QR Code', () => {
    render(<PixPaymentPage pixCode="codigo-pix-valido" />)
    
    const img = screen.getByRole('img', { name: /QR Code para pagamento Pix/i })
    expect(img).toBeInTheDocument()
    // Verifica se o código pix está na URL da imagem
    expect(img).toHaveAttribute('src', expect.stringContaining('codigo-pix-valido'))
  })

  it('deve copiar o código e alterar o estado do botão ao clicar', async () => {
    const pixCode = "codigo-para-copiar"
    mockWriteText.mockResolvedValue(undefined) // Simula sucesso imediato

    render(<PixPaymentPage pixCode={pixCode} />)

    // CORREÇÃO: Usando o nome exato que está no botão no HTML ("Copiar código pix")
    const copyButton = screen.getByRole('button', { name: /Copiar código pix/i })
    
    fireEvent.click(copyButton)

    // 1. Verifica se chamou a API do clipboard
    expect(mockWriteText).toHaveBeenCalledWith(pixCode)

    // 2. Aguarda a mudança visual do botão (Geralmente muda para "Copiado!" ou ícone de check)
    // Usamos regex flexível para pegar "Copiado", "Código copiado", etc.
    await waitFor(() => {
      expect(screen.getByText(/copiado/i)).toBeInTheDocument()
    })
  })

  it('deve lidar com erro ao copiar (console.error)', async () => {
    const pixCode = "codigo-erro"
    // Simula erro
    mockWriteText.mockRejectedValue(new Error('Erro de clipboard'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<PixPaymentPage pixCode={pixCode} />)

    const copyButton = screen.getByRole('button', { name: /Copiar código pix/i })
    fireEvent.click(copyButton)

    expect(mockWriteText).toHaveBeenCalledWith(pixCode)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})