import { register } from "module"

export const url = process.env.NEXT_PUBLIC_API_URL || 'https://api.imovelpericiado.com/v1'

export const endpoint = {
  addresses: '/places/autocomplete/',
  documents: {
    upload: '/documents/upload/',
  },
  payments: {
    process: '/payments/',
    status: '/payments',
  },
  start: '/auth/start/',
  verify: '/auth/verify/',
  refresh: '/auth/refresh/',
}
