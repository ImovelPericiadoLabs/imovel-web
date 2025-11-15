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
}

type Suggestion = {
  placePrediction?: Prediction
  queryPrediction?: Prediction
}

type AddressApiResponse = {
  suggestions?: Suggestion[]
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
      const query = item.queryPrediction

      return {
        street:
          place?.structuredFormat?.mainText?.text ?? query?.structuredFormat?.mainText?.text ?? '',

        city:
          place?.structuredFormat?.secondaryText?.text ??
          query?.structuredFormat?.secondaryText?.text ??
          '',

        value: place?.text?.text ?? query?.text?.text ?? '',
      }
    }) || []
  )
}
