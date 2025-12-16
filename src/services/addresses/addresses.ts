import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

type TextField = {
  text?: string
}

type AddressComponent = {
  longText: string
  shortText: string
  types: string[]
}

type StructuredFormat = {
  mainText?: TextField
  secondaryText?: TextField
}

type Prediction = {
  structuredFormat?: StructuredFormat
  text?: TextField
  placeId?: string
}

type Suggestion = {
  placePrediction?: Prediction
}

export type AddressApiResponse = {
  suggestions?: Suggestion[]
}

export type Registry = {
  id: string
  name: string
  number: number
  slug: string
  coverage: string[]
}

export type RegistryApiResponse = {
  registry?: Registry
}

type ListAddressRequest = {
  address: string
  placeId: string
}

export type ListAddressResponse = {
  formattedAddress?: string
  addressComponents?: AddressComponent[]
}

export type FormattedAddressResult = {
  address: string
  addressNumber: string | null
}

export async function listAddresses(address: string) {
  const data = {
    q: address,
    with_registry: false,
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_LIMIT')), 8000)
    )

    const requestPromise = api.post(endpoint.addresses, data)

    const result = (await Promise.race([
      requestPromise,
      timeoutPromise,
    ])) as AddressApiResponse

    return (
      result?.suggestions?.map((item) => {
        const place = item.placePrediction
        return {
          primary: place?.structuredFormat?.mainText?.text ?? '',
          secondary: place?.structuredFormat?.secondaryText?.text ?? '',
          value: place?.text?.text ?? '',
          placeId: place?.placeId,
        }
      }) || []
    )
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'Load failed' || error.message === 'Network Error') {
        throw new Error(
          'Bloqueio de rede (iOS). Desative a Retransmissão Privada ou troque de Wi-Fi.'
        )
      }
      if (error.message === 'TIMEOUT_LIMIT') {
        throw new Error('A conexão demorou muito para responder.')
      }
    }
    throw error
  }
}

export async function listAddress({
  address,
  placeId,
}: ListAddressRequest): Promise<FormattedAddressResult> {
  const data = {
    q: address,
    with_registry: false,
    place_id: placeId,
  }

  const result = (await api.post(
    endpoint.addresses,
    data
  )) as ListAddressResponse

  const finalAddress = result?.formattedAddress || ''
  const addressComponents = result?.addressComponents || []

  const numberComponent = addressComponents.find((c) =>
    c.types.includes('street_number')
  )

  return {
    address: finalAddress,
    addressNumber: numberComponent?.longText || null,
  }
}

export async function listRegistry(address: string) {
  const data = {
    q: address,
    with_registry: true,
  }

  const response = (await api.post(
    endpoint.addresses,
    data
  )) as RegistryApiResponse

  return response?.registry
}