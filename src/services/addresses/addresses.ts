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

/** Formato enviado/recebido no re-request (place_response). */
export type PlaceResponseFromApi = {
  formatted_address?: string
  street_number?: string
  route?: string
  neighborhood?: string
  sublocality?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
}

export type FormattedAddressResult = {
  address: string
  addressNumber: string | null
  postalCode?: string | null
  /** Montado a partir de addressComponents para enviar em re-request. */
  place_response?: PlaceResponseFromApi
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
  const postalCodeComponent = addressComponents.find((c) =>
    c.types.includes('postal_code')
  )

  const place_response = buildPlaceResponseFromComponents(
    addressComponents,
    finalAddress
  )

  return {
    address: finalAddress,
    addressNumber: numberComponent?.longText || null,
    postalCode: postalCodeComponent?.longText ?? null,
    place_response,
  }
}

function buildPlaceResponseFromComponents(
  components: AddressComponent[],
  formattedAddress: string
): PlaceResponseFromApi {
  const byType = (type: string) =>
    components.find((c) => c.types.includes(type))?.longText ?? undefined
  const postal = byType('postal_code')
  return {
    formatted_address: formattedAddress || undefined,
    street_number: byType('street_number'),
    route: byType('route'),
    neighborhood: byType('neighborhood') || byType('sublocality'),
    sublocality: byType('sublocality'),
    city: byType('locality'),
    state: byType('administrative_area_level_1'),
    country: byType('country'),
    postal_code: postal ? postal.replace(/\D/g, '').slice(0, 8) : undefined,
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