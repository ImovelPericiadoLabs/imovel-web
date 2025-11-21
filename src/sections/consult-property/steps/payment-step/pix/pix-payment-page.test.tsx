import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PixPaymentPage } from './pix-payment-page'

const mockWriteText = vi.fn()
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
})

describe('PixPaymentPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('deve renderizar com os valores padrão', () => {
        render(<PixPaymentPage />)

        expect(screen.getByText(/R\$ 67,56/)).toBeInTheDocument()
        expect(screen.getByText(/10:30/)).toBeInTheDocument()
        expect(screen.getByAltText('QR Code para pagamento Pix')).toBeInTheDocument()
        expect(screen.getByText('Aguardando o pagamento')).toBeInTheDocument()
    })

    it('deve renderizar com props customizadas', () => {
        const props = {
            amount: "150,00",
            expirationTime: "15:45",
            pixCode: "codigo-pix-teste"
        }

        render(<PixPaymentPage {...props} />)

        expect(screen.getByText(/R\$ 150,00/)).toBeInTheDocument()
        expect(screen.getByText(/15:45/)).toBeInTheDocument()

        expect(screen.getByText('codigo-pix-teste')).toBeInTheDocument()
    })

    it('deve gerar a URL correta para o QR Code', () => {
        const pixCode = "123456"
        render(<PixPaymentPage pixCode={pixCode} />)

        const img = screen.getByAltText('QR Code para pagamento Pix')
        const expectedUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&margin=0`

        expect(img).toHaveAttribute('src', expectedUrl)
    })

    it('deve copiar o código e alterar o estado do botão ao clicar', async () => {
        const pixCode = "codigo-para-copiar"
        render(<PixPaymentPage pixCode={pixCode} />)

        const button = screen.getByRole('button', { name: /Copiar código Pix/i })

        fireEvent.click(button)

        expect(mockWriteText).toHaveBeenCalledWith(pixCode)
        expect(mockWriteText).toHaveBeenCalledTimes(1)

        expect(await screen.findByText('Copiado!')).toBeInTheDocument()
        vi.advanceTimersByTime(2000)

        await waitFor(() => {
            expect(screen.getByText('Copiar código pix')).toBeInTheDocument()
        })
    })

    it('deve lidar com erro ao copiar (console.error)', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        mockWriteText.mockRejectedValueOnce(new Error('Falha clipboard'))

        render(<PixPaymentPage />)

        const button = screen.getByRole('button')
        fireEvent.click(button)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Falha ao copiar código pix:', expect.any(Error))
        })
    })
})