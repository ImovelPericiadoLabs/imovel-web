/**
 * Erro padronizado para respostas 400 da API no formato:
 * { "error": { "code": string, "message": string } }
 *
 * Códigos úteis: invalid_cep, invalid_status, missing_place_id,
 * invalid_place_id, no_plan, insufficient_credits.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
