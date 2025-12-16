import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import {
  listAddresses,
  listRegistry,
  listAddress,
  type AddressApiResponse,
  type RegistryApiResponse,
  type ListAddressResponse,
} from './addresses'

vi.mock('@/utils/api/client', () => ({
  __esModule: true,
  default: {
    post: vi.fn(),
  },
}))

const mockPost = vi.mocked(api.post)

const endpointAddresses = endpoint.addresses

describe('Address Services', () => {
  beforeEach(() => {
    mockPost.mockReset()
  })

  describe('listAddresses', () => {
    it('should call api.post with correct payload', async () => {
      mockPost.mockResolvedValue({ suggestions: [] } satisfies AddressApiResponse)

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
              placeId: 'place-id-mock',
              structuredFormat: {
                mainText: { text: 'Rua A' },
                secondaryText: { text: 'São Paulo' },
              },
              text: { text: 'rua-a-sp' },
            },
          },
        ],
      } satisfies AddressApiResponse)

      const result = await listAddresses('Rua A')

      expect(result).toEqual([
        {
          primary: 'Rua A',
          secondary: 'São Paulo',
          placeId: 'place-id-mock',
          value: 'rua-a-sp',
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
      } satisfies AddressApiResponse)

      const result = await listAddresses('Rua')

      expect(result).toEqual([
        {
          primary: '',
          secondary: '',
          value: '',
          placeId: undefined,
        },
      ])
    })

    it('should return empty array when suggestions is undefined', async () => {
      mockPost.mockResolvedValue({} satisfies AddressApiResponse)

      const result = await listAddresses('test')

      expect(result).toEqual([])
    })

    it('should return empty array when suggestions is empty', async () => {
      mockPost.mockResolvedValue({
        suggestions: [],
      } satisfies AddressApiResponse)

      const result = await listAddresses('anything')

      expect(result).toEqual([])
    })
  })

  describe('listRegistry', () => {
    it('should return registry when API returns registry', async () => {
      const registryResponse = {
        id: '019a937e-8994-7011-ae13-8b42884da89d',
        name: '1º Registro de Imóveis de São Bento do Sul',
        number: 1,
        slug: 'sao-bento-do-sul',
        coverage: ['campo-alegre', 'sao-bento-do-sul'],
      }

      mockPost.mockResolvedValue({
        registry: registryResponse,
      } satisfies RegistryApiResponse)

      const result = await listRegistry('Rua B')

      expect(result).toEqual(registryResponse)
    })

    it('should return undefined when registry is missing', async () => {
      mockPost.mockResolvedValue({} satisfies RegistryApiResponse)

      const result = await listRegistry('Rua C')

      expect(result).toBeUndefined()
    })
  })

  describe('listAddress', () => {
    it('should call api.post with correct payload', async () => {
      mockPost.mockResolvedValue({
        formattedAddress: 'Rua A, São Paulo',
      } satisfies ListAddressResponse)

      await listAddress({
        address: 'Rua A',
        placeId: 'place-id-123',
      })

      expect(mockPost).toHaveBeenCalledWith(endpointAddresses, {
        q: 'Rua A',
        with_registry: false,
        place_id: 'place-id-123',
      })
    })

    it('should return formattedAddress when API returns it', async () => {
      mockPost.mockResolvedValue({
        formattedAddress: 'Rua A, São Paulo',
      } satisfies ListAddressResponse)

      const result = await listAddress({
        address: 'Rua A',
        placeId: 'place-id-123',
      })

      expect(result).toBe('Rua A, São Paulo')
    })

    it('should return undefined when formattedAddress is missing', async () => {
      mockPost.mockResolvedValue({} as ListAddressResponse)

      const result = await listAddress({
        address: 'Rua B',
        placeId: 'place-id-987',
      })

      expect(result).toBeUndefined()
    })
  })
})
