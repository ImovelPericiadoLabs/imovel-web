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
  const payload = {
    q: address,
    with_registry: false,
  }

  try {
    // Tenta fazer a requisição
    const response = await api.post(endpoint.addresses, payload)

    // SE DER CERTO: Retorna um objeto de Debug de Sucesso
    return {
      _DEBUG_STATUS: 'SUCESSO (200 OK)',
      _DEBUG_TYPE: 'API_RESPONSE',
      payload_enviado: payload,
      resposta_recebida: response, // O que veio da API
    }

  } catch (error: any) {
    // SE DER ERRO: Captura o erro e RETORNA ele (não dá throw)

    // Tenta extrair detalhes se for um erro de Axios/HTTP
    const errorDetails = {
      status: error.response?.status || 'Sem status',
      statusText: error.response?.statusText || 'Sem texto',
      data: error.response?.data || 'Sem body de resposta',
      headers: error.response?.headers || 'Sem headers',
      message: error.message,
      code: error.code
    }

    return {
      _DEBUG_STATUS: 'ERRO / EXCEPTION',
      _DEBUG_TYPE: 'API_ERROR',
      payload_enviado: payload,
      detalhes_erro: errorDetails
    }
  }
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
