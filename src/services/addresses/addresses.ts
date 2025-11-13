import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

type AddressApiResponse = {
  suggestions?: {
    placePrediction?: {
      structuredFormat?: {
        mainText?: {
          text?: string
        }
        secondaryText?: {
          text?: string
        }
      }
      text?: {
        text?: string
      }
    }
  }[]
}

export async function listAddresses(address: string) {
  const data = {
    q: address,
    with_registry: false,
  }
  const addresses = (await api.post(endpoint.addresses, data)) as AddressApiResponse

  return addresses?.suggestions?.map((item) => ({
    street: item?.placePrediction?.structuredFormat?.mainText?.text,
    city: item?.placePrediction?.structuredFormat?.secondaryText?.text,
    value: item?.placePrediction?.text?.text,
  }))
}
