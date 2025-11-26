export const url = process.env.NEXT_PUBLIC_API_URL || 'https://api.imovelpericiado.com/v1'

export const endpoint = {
  addresses: '/places/autocomplete/',
  documents: {
    upload: '/documents/upload/',
  },
  payments: {
    process: '/payments/',
  },
}
