import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const pushMock = vi.fn()
let query = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => query,
}))

// Os ícones não são o objeto do teste, e o barrel do lucide-react resolve ~1500
// módulos — o suficiente para o arquivo levar minutos em disco lento.
vi.mock('lucide-react', () => ({
  ArrowRight: () => null,
  BadgeCheck: () => null,
  Ticket: () => null,
  TriangleAlert: () => null,
}))

const validateVoucher = vi.fn()
vi.mock('@/services/vouchers', () => ({
  validateVoucher: (...args: unknown[]) => validateVoucher(...args),
}))

import ResgateClient from './resgate-client'
import { readVoucherCode } from '@/utils/voucher-session'

// `retry: false` também no cliente de teste: sem isso, o caso de falha de rede fica
// tentando de novo e o teste mede o backoff do react-query, não a tela.
function renderResgate() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ResgateClient />
    </QueryClientProvider>,
  )
}

const VALID = {
  valid: true as const,
  event_name: 'JetExperience',
  benefits: [
    { entry_path: 'document' as const, kind: 'FREE' as const, value: null, describe: 'Por Documento (grátis)' },
    { entry_path: 'address' as const, kind: 'PERCENT' as const, value: '50', describe: 'Por Endereço (50% off)' },
  ],
  benefits_display: 'Por Documento (grátis), Por Endereço (50% off)',
  allowed_entry_paths: ['document' as const, 'address' as const],
  allowed_entry_paths_display: 'Por Documento, Por Endereço',
  valid_until: '2026-09-04T00:00:00Z',
  requires_login: true,
}

describe('ResgateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
    query = new URLSearchParams()
  })

  it('valida sozinho o código que veio no QR do cartão', async () => {
    query = new URLSearchParams('code=ABCD1234EFGH')
    validateVoucher.mockResolvedValue(VALID)

    renderResgate()

    await waitFor(() => expect(validateVoucher).toHaveBeenCalledWith('ABCD1234EFGH'))
    expect(await screen.findByText('Voucher válido')).toBeInTheDocument()
  })

  it('mostra uma linha por modalidade, com o texto que veio do backend', async () => {
    query = new URLSearchParams('code=ABCD1234EFGH')
    validateVoucher.mockResolvedValue(VALID)

    renderResgate()

    expect(await screen.findByText('Por Documento (grátis)')).toBeInTheDocument()
    expect(screen.getByText('Por Endereço (50% off)')).toBeInTheDocument()
  })

  it('não valida com entry_path: a modalidade ainda não foi escolhida', async () => {
    // Chutar uma modalidade aqui faria um voucher bom aparecer como recusado.
    query = new URLSearchParams('code=ABCD1234EFGH')
    validateVoucher.mockResolvedValue(VALID)

    renderResgate()

    await waitFor(() => expect(validateVoucher).toHaveBeenCalledTimes(1))
    expect(validateVoucher).toHaveBeenCalledWith('ABCD1234EFGH')
  })

  it('guarda o código e leva para a consulta ao usar o voucher', async () => {
    query = new URLSearchParams('code=ABCD1234EFGH')
    validateVoucher.mockResolvedValue(VALID)

    renderResgate()
    fireEvent.click(await screen.findByRole('button', { name: /usar meu voucher/i }))

    expect(readVoucherCode()).toBe('ABCD1234EFGH')
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/consultar-imovel'))
  })

  it('deixa digitar o código quando o QR não escaneia', async () => {
    // Caso real de evento: luz ruim, capa de celular, câmera velha. O código está
    // impresso no cartão logo abaixo do QR.
    validateVoucher.mockResolvedValue(VALID)

    renderResgate()
    fireEvent.change(screen.getByLabelText(/código do cartão/i), {
      target: { value: 'abcd-1234-efgh' },
    })
    fireEvent.click(screen.getByRole('button', { name: /conferir/i }))

    await waitFor(() => expect(validateVoucher).toHaveBeenCalledWith('abcd-1234-efgh'))
  })

  it('não valida sozinho quando não veio código na URL', () => {
    renderResgate()

    expect(validateVoucher).not.toHaveBeenCalled()
  })

  it('mostra o motivo da recusa e ainda oferece a consulta normal', async () => {
    query = new URLSearchParams('code=ABCD1234EFGH')
    validateVoucher.mockResolvedValue({
      valid: false, code: 'voucher_expired', message: 'Este voucher venceu em 04/09/2026.',
    })

    renderResgate()

    expect(await screen.findByText('Este voucher venceu em 04/09/2026.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /fazer a consulta mesmo assim/i })).toBeInTheDocument()
  })

  it('separa falha de rede de voucher inválido', async () => {
    // Wi-Fi de salão de evento cai. Dizer "inválido" aqui faria a pessoa jogar fora
    // um cartão que está bom.
    query = new URLSearchParams('code=ABCD1234EFGH')
    validateVoucher.mockRejectedValue(new Error('network'))

    renderResgate()

    expect(await screen.findByText(/não conseguimos conferir agora/i)).toBeInTheDocument()
  })

  it('não guarda o código quando o voucher foi recusado', async () => {
    query = new URLSearchParams('code=ABCD1234EFGH')
    validateVoucher.mockResolvedValue({ valid: false, code: 'x', message: 'Já utilizado.' })

    renderResgate()
    await screen.findByText('Já utilizado.')

    expect(screen.queryByRole('button', { name: /usar meu voucher/i })).not.toBeInTheDocument()
    expect(readVoucherCode()).toBe('')
  })
})
