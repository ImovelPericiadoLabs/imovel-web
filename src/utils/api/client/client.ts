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
    const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }


    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    // Log para garantir qual URL exata o servidor está tentando acessar
    console.log(`[DEBUG] POST URL: ${apiUrl}${url}`)

    const response = await fetch(`${apiUrl}${url}`, {
      method: 'POST',
      headers,
      body: isFormData ? rawBody : JSON.stringify(rawBody),
    })

    // 1. Pegamos o texto puro antes de tentar converter para JSON
    const responseText = await response.text()

    // 2. Tenta fazer o parse manualmente
    let result
    try {
      result = JSON.parse(responseText)
    } catch (error) {
      // AQUI ESTÁ O OURO: Se falhar, vamos ver o HTML no log da Vercel
      console.error('------- ERRO DE PARSE JSON -------')
      console.error('Status Code:', response.status)
      console.error('Conteúdo recebido (HTML?):', responseText.slice(0, 500)) // Mostra os primeiros 500 caracteres
      console.error('----------------------------------')

      throw new Error(`A API retornou HTML em vez de JSON. Status: ${response.status}`)
    }

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
