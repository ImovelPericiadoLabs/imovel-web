import { signOut } from 'next-auth/react'
import { url } from '@/constants/api'
import { ApiError } from '@/utils/api/errors'
import { clearAuthClientFlag } from '@/utils/auth-client-flag'

const apiUrl = url
const INTERNAL_API_HEADER_NAME = process.env.INTERNAL_API_HEADER_NAME || 'x-internal-auth'
const INTERNAL_API_SHARED_SECRET = process.env.INTERNAL_API_SHARED_SECRET

function logInternalHeaderDecision(method: string, endpointPath: string, applied: boolean, reason: string) {
  if (typeof window !== 'undefined') return

  console.info('[api][internal-header]', {
    method,
    url: `${apiUrl}${endpointPath}`,
    headerName: INTERNAL_API_HEADER_NAME,
    hasInternalSecretConfigured: Boolean(INTERNAL_API_SHARED_SECRET),
    applied,
    reason,
  })
}

function appendInternalApiHeader(
  headers: Record<string, string>,
  method: string,
  endpointPath: string,
) {
  const isServerSide = typeof window === 'undefined'

  if (!isServerSide) {
    logInternalHeaderDecision(method, endpointPath, false, 'browser_request')
    return
  }

  if (!INTERNAL_API_SHARED_SECRET) {
    logInternalHeaderDecision(method, endpointPath, false, 'missing_internal_secret')
    return
  }

  headers[INTERNAL_API_HEADER_NAME] = INTERNAL_API_SHARED_SECRET
  logInternalHeaderDecision(method, endpointPath, true, 'header_attached')
}

async function handleUnauthorized() {
  if (typeof window === 'undefined') return
  clearAuthClientFlag()
  window.dispatchEvent(new Event('auth:unauthorized'))
  await signOut({ redirect: false })
}

const api = {
  async get(url: string, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    appendInternalApiHeader(headers, 'GET', url)

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${apiUrl}${url}`, {
      headers,
      method: 'GET',
    })

    const responseText = await response.text()
    let result: unknown = {}
    if (responseText) {
      try {
        result = JSON.parse(responseText) as unknown
      } catch {
        if (!response.ok) {
          throw new Error(`Resposta inválida da API (${response.status}).`)
        }
        throw new Error('Resposta inválida da API')
      }
    }

    if (response.status === 401) {
      await handleUnauthorized()
      throw result
    }

    if (response.status === 400 || response.status === 403 || response.status === 429 || response.status === 502) {
      const body = result && typeof result === 'object' ? (result as Record<string, unknown>) : {}
      const err = body.error as { code?: string; message?: string } | undefined
      if (err && typeof err.code === 'string' && typeof err.message === 'string') {
        throw new ApiError(err.code, err.message)
      }
      const detail = body.detail
      if (typeof detail === 'string') {
        throw new Error(detail)
      }
      throw new Error(typeof body.message === 'string' ? body.message : 'Erro na requisição')
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`)
    }

    return result
  },

  /**
   * GET que retorna o corpo como Blob (ex.: PDF).
   * pathOrUrl: caminho relativo (ex.: /analysis/pdfview/xxx) ou URL absoluta.
   */
  async getBlob(pathOrUrl: string, token?: string): Promise<Blob> {
    const fullUrl = pathOrUrl.startsWith('http') ? pathOrUrl : `${apiUrl}${pathOrUrl}`
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    appendInternalApiHeader(headers, 'GET', pathOrUrl.startsWith('http') ? pathOrUrl : pathOrUrl)
    const response = await fetch(fullUrl, { method: 'GET', headers })
    if (response.status === 401) {
      await handleUnauthorized()
      throw new Error('Não autorizado')
    }
    if (!response.ok) throw new Error(`Erro ${response.status}`)
    return response.blob()
  },

  async post(
    url: string,
    rawBody: object,
    token?: string,
    extraHeaders?: Record<string, string>,
  ) {
    const isFormData = rawBody instanceof FormData
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    appendInternalApiHeader(headers, 'POST', url)

    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (extraHeaders) {
      Object.assign(headers, extraHeaders)
    }

    const response = await fetch(`${apiUrl}${url}`, {
      method: 'POST',
      headers,
      body: isFormData ? rawBody : JSON.stringify(rawBody),
    })

    const responseText = await response.text()
    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      const isHtmlResponse = /<html|<!doctype html/i.test(responseText)
      const message = isHtmlResponse
        ? `Resposta HTML inesperada da API (${response.status}). Verifique URL da API e possíveis bloqueios de firewall/WAF.`
        : `Resposta inválida da API (${response.status}).`
      throw new Error(message)
    }

    if (response.status === 401) {
      await handleUnauthorized()
      throw result
    }

    if (response.status === 400 || response.status === 403 || response.status === 429 || response.status === 502) {
      const err = result?.error
      if (err && typeof err.code === 'string' && typeof err.message === 'string') {
        throw new ApiError(err.code, err.message)
      }
      throw new Error(typeof result?.message === 'string' ? result.message : 'Erro na requisição')
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`)
    }

    return result
  },

  async patch(url: string, body: object, token?: string) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    appendInternalApiHeader(headers, 'PATCH', url)

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${apiUrl}${url}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })

    const responseText = await response.text()
    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      const isHtmlResponse = /<html|<!doctype html/i.test(responseText)
      const message = isHtmlResponse
        ? `Resposta HTML inesperada da API (${response.status}). Verifique URL da API e possíveis bloqueios de firewall/WAF.`
        : `Resposta inválida da API (${response.status}).`
      throw new Error(message)
    }

    if (response.status === 401) {
      await handleUnauthorized()
      throw result
    }

    if (response.status === 400 || response.status === 403 || response.status === 429) {
      const err = result?.error
      if (err && typeof err.code === 'string' && typeof err.message === 'string') {
        throw new ApiError(err.code, err.message)
      }
      const detail = result?.detail
      if (typeof detail === 'string') {
        throw new Error(detail)
      }
      throw new Error(typeof result?.message === 'string' ? result.message : 'Erro na requisição')
    }

    return result
  },

  async put(url: string, body: object) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    appendInternalApiHeader(headers, 'PUT', url)

    const response = await fetch(`${apiUrl}${url}`, {
      headers,
      body: JSON.stringify(body),
      method: 'PUT',
    })

    const result = await response.text()

    if (response.status === 401) {
      await handleUnauthorized()
      throw result
    }

    return result
  },

  async delete(url: string, token?: string) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    appendInternalApiHeader(headers, 'DELETE', url)

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${apiUrl}${url}`, {
      headers,
      method: 'DELETE',
    })

    const responseText = await response.text()

    if (response.status === 401) {
      await handleUnauthorized()
      throw responseText
    }

    if (response.status === 400 || response.status === 403) {
      let result: { error?: { code?: string; message?: string }; detail?: string }
      try {
        result = responseText ? JSON.parse(responseText) : {}
      } catch {
        throw new Error('Resposta inválida da API')
      }
      const err = result?.error
      if (err && typeof err.code === 'string' && typeof err.message === 'string') {
        throw new ApiError(err.code, err.message)
      }
      const detail = result?.detail
      if (typeof detail === 'string') {
        throw new Error(detail)
      }
      throw new Error('Erro na requisição')
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`)
    }

    if (response.status === 204 || !responseText) {
      return {}
    }
    try {
      return JSON.parse(responseText)
    } catch {
      return {}
    }
  },

  async upload(url: string, documentType: string, file: File, onProgress: (percent: number) => void) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${apiUrl}${url}`)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 401) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:unauthorized'))
            void signOut({ redirect: false })
          }
          reject(xhr.responseText)
          return
        }

        try {
          resolve(JSON.parse(xhr.responseText))
        } catch (e) {
          reject(e)
        }
      }

      xhr.onerror = reject

      const form = new FormData()
      form.append('type', documentType.toUpperCase())
      form.append('file_path', file)
      xhr.send(form)
    })
  },
}

export default api