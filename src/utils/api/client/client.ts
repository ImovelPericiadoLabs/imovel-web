import { url } from '@/constants/api'

const apiUrl = url

const api = {
  async get(url: string) {
    const response = await fetch(`${apiUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })

    const result = await response.json()

    if (response.status === 401) {
      throw result
    }

    return result
  },

  async post(url: string, rawBody: object) {
    const isFormData = rawBody instanceof FormData

    const headers: Record<string, string> = {}

    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${apiUrl}${url}`, {
      method: 'POST',
      headers,
      body: isFormData ? rawBody : JSON.stringify(rawBody),
    })

    const result = await response.json()

    if (response.status === 401) {
      throw result
    }

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
