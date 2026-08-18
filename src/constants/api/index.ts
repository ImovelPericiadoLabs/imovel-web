export const url = process.env.NEXT_PUBLIC_API_URL || 'https://api.imovelpericiado.com/v1'

/** Base WebSocket URL mirroring `NEXT_PUBLIC_API_URL` (incl. /v1): http→ws, https→wss. */
export const wsUrl = url.replace(/^http/, 'ws')

export const endpoint = {
  addresses: '/places/autocomplete/',
  documents: {
    upload: '/documents/upload/',
  },
  payments: {
    process: '/payments/',
    status: '/payments',
    quote: '/payments/quote/',
    pricingTable: '/payments/pricing-table/',
  },
  start: '/auth/start/',
  verify: '/auth/verify/',
  refresh: '/auth/refresh/',
  me: '/me/',
  orders: '/orders/',
  reRequest: (orderId: string) => `/orders/${orderId}/re-request/`,
  notaryReply: (orderId: string) => `/orders/${orderId}/notary-reply/`,
  /** Proprietários extraídos da matrícula. GET /orders/:id/owners */
  orderOwners: (orderId: string) => `/orders/${orderId}/owners`,
  /** Veredictos por agente (semáforo + justificativa). GET /orders/:id/analyses */
  orderAnalyses: (orderId: string) => `/orders/${orderId}/analyses`,
  /** Documentos relacionados (matrícula, certidões, laudo) com URL assinada. GET /orders/:id/documents */
  orderDocuments: (orderId: string) => `/orders/${orderId}/documents`,
  plans: '/plans/',
  /** PDF do relatório de análise. GET com Bearer retorna application/pdf. Parâmetro: order ID. */
  analysisPdfView: (orderId: string) => `/analysis/pdfview/${orderId}`,
  /** Consent delegado (authorization_code + PKCE). GET valida e retorna metadados; POST emite o code. */
  partnerOAuthAuthorize: '/partner/oauth/authorize/',
  /** Parceiros que o cliente final autorizou (consentimentos ativos). */
  connectedPartners: '/me/connected-partners/',
  /** Revoga o acesso de um parceiro (invalida tokens emitidos). */
  connectedPartner: (id: string) => `/me/connected-partners/${id}/`,
  outreach: {
    registryTemplates: '/admin/outreach/templates/registry/',
    emailTemplates: '/admin/outreach/templates/email-db/',
    whatsappSpecs: '/admin/outreach/templates/whatsapp-db/',
    metaWaPreview: '/admin/outreach/templates/whatsapp-db/meta-preview/',
    metaWaSync: '/admin/outreach/templates/whatsapp-db/sync-from-meta/',
    campaigns: '/admin/outreach/campaigns/',
    campaignsCreateFromRows: '/admin/outreach/campaigns/create-from-rows/',
    campaignAppendRows: (id: string) => `/admin/outreach/campaigns/${id}/append-rows/`,
    campaign: (id: string) => `/admin/outreach/campaigns/${id}/`,
    campaignPreview: (id: string) => `/admin/outreach/campaigns/${id}/preview/`,
    campaignSend: (id: string) => `/admin/outreach/campaigns/${id}/send/`,
    campaignRecipients: (id: string) => `/admin/outreach/campaigns/${id}/recipients/`,
  },
  staff: {
    manualReviewOrders: '/admin/staff/manual-review/orders/',
    manualReviewOrder: (id: string) => `/admin/staff/manual-review/orders/${id}/`,
    manualReviewUpload: (id: string) => `/admin/staff/manual-review/orders/${id}/registration-upload/`,
    manualReviewEnqueue: (id: string) => `/admin/staff/manual-review/orders/${id}/enqueue-analysis/`,
    manualReviewResolve: (id: string) => `/admin/staff/manual-review/orders/${id}/resolve/`,
    partnerAccounts: '/admin/staff/partner-accounts/',
    partnerAccount: (id: string) => `/admin/staff/partner-accounts/${id}/`,
    partnerAccountCredits: (id: string) => `/admin/staff/partner-accounts/${id}/credits/`,
    /** Parceiros B2B (Organization + credenciais OAuth). */
    partners: '/admin/staff/partners/',
    partner: (id: string) => `/admin/staff/partners/${id}/`,
    partnerRotateSecret: (id: string) => `/admin/staff/partners/${id}/rotate-secret/`,
    partnerCredits: (id: string) => `/admin/staff/partners/${id}/credits/`,
    partnerSendOnboarding: (id: string) => `/admin/staff/partners/${id}/send-onboarding/`,
    partnerLogo: (id: string) => `/admin/staff/partners/${id}/logo/`,
    partnerIntegrationReport: (id: string) => `/admin/staff/partners/${id}/integration-report/`,
    partnerIntegrationReportPreview: (id: string) =>
      `/admin/staff/partners/${id}/integration-report/preview/`,
    partnerIntegrationReportSend: (id: string) =>
      `/admin/staff/partners/${id}/integration-report/send/`,
    /** Overview de custo/receita (dashboard financeiro). */
    costsOverview: '/admin/staff/costs/overview/',
  },
  chat: {
    campaigns: '/admin/chat/campaigns/',
    campaign: (id: string) => `/admin/chat/campaigns/${id}/`,
    conversations: '/admin/chat/conversations/',
    conversation: (id: string) => `/admin/chat/conversations/${id}/`,
    conversationMessages: (id: string) => `/admin/chat/conversations/${id}/messages/`,
    conversationHandoff: (id: string) => `/admin/chat/conversations/${id}/handoff/`,
    conversationToggleAi: (id: string) => `/admin/chat/conversations/${id}/toggle-ai/`,
    conversationReplayAi: (id: string) => `/admin/chat/conversations/${id}/replay-ai/`,
    conversationAiPendingApprove: (id: string) => `/admin/chat/conversations/${id}/ai-pending/approve/`,
    conversationAiPendingReject: (id: string) => `/admin/chat/conversations/${id}/ai-pending/reject/`,
    waMedia: (mediaId: string) => `/admin/chat/wa-media/${encodeURIComponent(mediaId)}/`,
    leads: '/admin/chat/leads/',
    lead: (id: string) => `/admin/chat/leads/${id}/`,
    scheduled: '/admin/chat/scheduled/',
    scheduledCancel: (id: string) => `/admin/chat/scheduled/${id}/cancel/`,
  },
  messaging: {
    conversations: '/staff/inbox/conversations/',
    conversation: (id: string) => `/staff/inbox/conversations/${id}/`,
    relayhubMeta: '/staff/integrations/relayhub/meta/',
    relayhubConnections: '/staff/integrations/relayhub/connections/',
    relayhubConnection: (id: string) => `/staff/integrations/relayhub/connections/${id}/`,
    relayhubConnectionQr: (id: string) => `/staff/integrations/relayhub/connections/${id}/qr/`,
    relayhubConnectionAction: (id: string, action: string) =>
      `/staff/integrations/relayhub/connections/${id}/${action}/`,
  },
}