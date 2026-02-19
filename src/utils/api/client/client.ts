import { signOut } from 'next-auth/react'
import { url } from '@/constants/api'

const apiUrl = url
const INTERNAL_API_HEADER_NAME = process.env.INTERNAL_API_HEADER_NAME || 'x-internal-auth'
const INTERNAL_API_SHARED_SECRET = process.env.INTERNAL_API_SHARED_SECRET

function appendInternalApiHeader(headers: Record<string, string>) {
  const isServerSide = typeof window === 'undefined'

  if (!isServerSide || !INTERNAL_API_SHARED_SECRET) {
    return
  }

  headers[INTERNAL_API_HEADER_NAME] = INTERNAL_API_SHARED_SECRET
}

async function handleUnauthorized() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('auth:unauthorized'))
  await signOut({ redirect: false })
}

const api = {
  async get(url: string, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    appendInternalApiHeader(headers)

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${apiUrl}${url}`, {
      headers,
      method: 'GET',
    })

    const result = await response.json()

    if (response.status === 401) {
      await handleUnauthorized()
      throw result
    }

    return result
  },

  async post(url: string, rawBody: object, token?: string) {
    const isFormData = rawBody instanceof FormData
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    appendInternalApiHeader(headers)

    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
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

    return result
  },

  async put(url: string, body: object) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    appendInternalApiHeader(headers)

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

  async delete(url: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    appendInternalApiHeader(headers)

    const response = await fetch(`${apiUrl}${url}`, {
      headers,
      method: 'DELETE',
    })

    const result = await response.text()

    if (response.status === 401) {
      await handleUnauthorized()
      throw result
    }

    return result
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