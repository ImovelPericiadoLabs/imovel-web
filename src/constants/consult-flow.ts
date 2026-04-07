/**
 * Query que força o fluxo em /consultar-imovel a voltar para “Como quer começar?”.
 * Necessário em navegação client-side: o componente não remonta só com /consultar-imovel.
 */
export const CONSULT_FLUXO_INICIO_QUERY = 'inicio'

export const CONSULTAR_IMOVEL_INICIO_HREF = `/consultar-imovel?${CONSULT_FLUXO_INICIO_QUERY}=1`
