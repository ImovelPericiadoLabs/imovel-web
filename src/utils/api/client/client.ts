import { url } from '@/constants/api'

const apiUrl = url

const api = {
  async get(url: string, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${apiUrl}${url}`, {
      headers, 
      method: 'GET',
    })

    const result = await response.json()
    if (response.status === 401) throw result
    return result
  },

  async post(url: string, rawBody: object, token?: string) {
    const isFormData = rawBody instanceof FormData
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 ...'
    }

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
    } catch (e) {
      throw new Error(`Erro parse...`)
    }

    if (response.status === 401) throw result
    return result
  },

  async put(url: string, body: object) {
    const response = await fetch(`${apiUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      method: 'PUT',
    })

    const result = await response.text()

    if (response.status === 401) {
      throw result
    }

    return result
  },

  async delete(url: string) {
    const response = await fetch(`${apiUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    })

    const result = await response.text()

    if (response.status === 401) {
      throw result
    }

    return result
  },

  async upload(url: string, file: File, onProgress: (percent: number) => void) {
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
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch (e) {
          reject(e)
        }
      }

      xhr.onerror = reject

      const form = new FormData()
      form.append('file_path', file)
      xhr.send(form)
    })
  },
}

export default api
