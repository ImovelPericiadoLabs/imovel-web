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

  async post(url: string, body: object) {
    const response = await fetch(`${apiUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      method: 'POST',
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
}

export default api
