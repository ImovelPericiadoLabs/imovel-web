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
  me: '/me/',
  orders: '/orders/',
  reRequest: (orderId: string) => `/orders/${orderId}/re-request/`,
  plans: '/plans/',
  /** PDF do relatório de análise. GET com Bearer retorna application/pdf. Parâmetro: order ID. */
  analysisPdfView: (orderId: string) => `/analysis/pdfview/${orderId}`,
  outreach: {
    registryTemplates: '/admin/outreach/templates/registry/',
    emailTemplates: '/admin/outreach/templates/email-db/',
    whatsappSpecs: '/admin/outreach/templates/whatsapp-db/',
    metaWaPreview: '/admin/outreach/templates/whatsapp-db/meta-preview/',
    metaWaSync: '/admin/outreach/templates/whatsapp-db/sync-from-meta/',
    campaigns: '/admin/outreach/campaigns/',
    campaignsCreate: '/admin/outreach/campaigns/create/',
    campaign: (id: string) => `/admin/outreach/campaigns/${id}/`,
    campaignPreview: (id: string) => `/admin/outreach/campaigns/${id}/preview/`,
    campaignSend: (id: string) => `/admin/outreach/campaigns/${id}/send/`,
    campaignRecipients: (id: string) => `/admin/outreach/campaigns/${id}/recipients/`,
  },
}