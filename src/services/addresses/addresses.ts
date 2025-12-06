import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

type TextField = {
  text?: string
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
  registry: Registry
}

type ListAddressRequest = {
  address: string
  placeId: string
}

export type ListAddressResponse = {
  formattedAddress: string
}

export async function listAddresses(address: string) {
  const data = {
    q: address,
    with_registry: false,
  }

  const addresses = (await api.post(endpoint.addresses, data)) as AddressApiResponse

  return (
    addresses?.suggestions?.map((item) => {
      const place = item.placePrediction

      return {
        primary: place?.structuredFormat?.mainText?.text ?? '',

        secondary: place?.structuredFormat?.secondaryText?.text ?? '',

        value: place?.text?.text ?? '',
        placeId: place?.placeId,
      }
    }) || []
  )
}

export async function listAddress({ address, placeId }: ListAddressRequest) {
  const data = {
    q: address,
    with_registry: false,
    place_id: placeId,
  }

  const result = (await api.post(endpoint.addresses, data)) as AddressApiResponse

  const firstSuggestion = result?.suggestions?.[0]?.placePrediction

  const finalAddress = firstSuggestion?.text?.text ||
    firstSuggestion?.structuredFormat?.mainText?.text ||
    ''

  return {
    address: finalAddress
  }
}

export async function listRegistry(address: string) {
  const data = {
    q: address,
    with_registry: true,
  }

  const addresses = (await api.post(endpoint.addresses, data)) as RegistryApiResponse

  return addresses?.registry
}
