import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { listAddresses, listRegistry } from './addresses'

vi.mock('@/utils/api/client', () => ({
  __esModule: true,
  default: {
    post: vi.fn(),
  },
}))

const mockPost = api.post as unknown as ReturnType<typeof vi.fn>
const endpointAddresses = endpoint.addresses

describe('listAddresses', () => {
  beforeEach(() => {
    mockPost.mockReset()
  })

  it('should call api.post with correct payload', async () => {
    mockPost.mockResolvedValue({ suggestions: [] })

    await listAddresses('Rua A')

    expect(mockPost).toHaveBeenCalledWith(endpointAddresses, {
      q: 'Rua A',
      with_registry: false,
    })
  })

  it('should map placePrediction suggestions correctly', async () => {
    mockPost.mockResolvedValue({
      suggestions: [
        {
          placePrediction: {
            structuredFormat: {
              mainText: { text: 'Rua A' },
              secondaryText: { text: 'São Paulo' },
            },
            text: { text: 'rua-a-sp' },
          },
        },
      ],
    })

    const result = await listAddresses('Rua A')

    expect(result).toEqual([
      {
        street: 'Rua A',
        city: 'São Paulo',
        value: 'rua-a-sp',
      },
    ])
  })

  it('should map queryPrediction when placePrediction is missing', async () => {
    mockPost.mockResolvedValue({
      suggestions: [
        {
          queryPrediction: {
            structuredFormat: {
              mainText: { text: 'Av Brasil' },
              secondaryText: { text: 'Curitiba' },
            },
            text: { text: 'av-brasil-ctba' },
          },
        },
      ],
    })

    const result = await listAddresses('Av Brasil')

    expect(result).toEqual([
      {
        street: 'Av Brasil',
        city: 'Curitiba',
        value: 'av-brasil-ctba',
      },
    ])
  })

  it('should return empty strings when fields are missing', async () => {
    mockPost.mockResolvedValue({
      suggestions: [
        {
          placePrediction: {
            structuredFormat: {},
            text: {},
          },
        },
      ],
    })

    const result = await listAddresses('Rua')

    expect(result).toEqual([
      {
        street: '',
        city: '',
        value: '',
      },
    ])
  })

  it('should return empty array when suggestions is undefined', async () => {
    mockPost.mockResolvedValue({})

    const result = await listAddresses('test')

    expect(result).toEqual([])
  })

  it('should return empty array when suggestions is empty', async () => {
    mockPost.mockResolvedValue({ suggestions: [] })

    const result = await listAddresses('anything')

    expect(result).toEqual([])
  })

  it('should return registry when API returns registry', async () => {
    const registryResponse = {
      id: '019a937e-8994-7011-ae13-8b42884da89d',
      name: '1º Registro de Imóveis de São Bento do Sul',
      number: 1,
      slug: 'sao-bento-do-sul',
      coverage: ['campo-alegre', 'sao-bento-do-sul'],
    }

    mockPost.mockResolvedValue({ registry: registryResponse })

    const result = await listRegistry('Rua B')

    expect(result).toEqual(registryResponse)
  })

  it('should return undefined when registry is missing', async () => {
    mockPost.mockResolvedValue({})

    const result = await listRegistry('Rua C')

    expect(result).toBeUndefined()
  })
})
