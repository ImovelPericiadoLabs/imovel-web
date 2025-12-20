import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api from './client'
import { signOut } from 'next-auth/react'

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

const mockJsonResponse = (data: object, status = 200) =>
  Promise.resolve({
    status,
    ok: status < 400,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })

const mockTextResponse = (data: string, status = 200) =>
  Promise.resolve({
    status,
    ok: status < 400,
    json: () => Promise.reject(new Error('Invalid JSON')),
    text: () => Promise.resolve(data),
  })

beforeEach(() => {
  mockFetch.mockReset()
  vi.clearAllMocks()
})

describe('api.get', () => {
  it('deve realizar GET com cabeçalhos JSON e token opcional', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ data: 'ok' }))

    const result = await api.get('/test', 'my-token')

    expect(result).toEqual({ data: 'ok' })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      },
    })
  })

  it('deve chamar signOut e lançar erro em status 401', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Unauthorized' }, 401))

    await expect(api.get('/unauth')).rejects.toEqual({ error: 'Unauthorized' })
    expect(signOut).toHaveBeenCalled()
  })
})

describe('api.post', () => {
  it('deve enviar JSON e tratar resposta text/json corretamente', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ success: true }))

    const body = { key: 'value' }
    const result = await api.post('/post', body)

    expect(result).toEqual({ success: true })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/post'), 
      expect.objectContaining({
        body: JSON.stringify(body),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    )
  })

  it('deve suportar FormData e omitir Content-Type manual', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ ok: true }))

    const formData = new FormData()
    formData.append('test', 'file')

    await api.post('/form', formData)

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.body).toBeInstanceOf(FormData)
    expect(callArgs.headers).not.toHaveProperty('Content-Type')
  })

  it('deve lançar erro de parse se o retorno não for um JSON válido', async () => {
    mockFetch.mockResolvedValue(mockTextResponse('NOT_JSON'))
    await expect(api.post('/invalid', {})).rejects.toThrow('Erro parse...')
  })
})

describe('api.put & api.delete', () => {
  it('deve processar PUT e retornar a resposta como texto', async () => {
    mockFetch.mockResolvedValue(mockTextResponse('updated'))
    const result = await api.put('/update', { x: 1 })
    expect(result).toBe('updated')
  })

  it('deve processar DELETE e disparar signOut em caso de 401', async () => {
    mockFetch.mockResolvedValue(mockTextResponse('unauthorized', 401))
    await expect(api.delete('/remove')).rejects.toBe('unauthorized')
    expect(signOut).toHaveBeenCalled()
  })
})

describe('api.upload', () => {
  let originalXHR: any

  class MockXHR {
    static instance: MockXHR
    status = 200
    responseText = ''
    onload = () => {}
    onerror = () => {}
    upload = { onprogress: (ev: any) => {} }
    open = vi.fn()
    send = vi.fn()

    constructor() { MockXHR.instance = this }
  }

  beforeEach(() => {
    originalXHR = global.XMLHttpRequest
    global.XMLHttpRequest = MockXHR as any
  })

  afterEach(() => {
    global.XMLHttpRequest = originalXHR
  })

  it('deve realizar upload e reportar progresso', async () => {
    const file = new File(['data'], 'test.png')
    const onProgress = vi.fn()

    const promise = api.upload('/upload', file, onProgress)
    const xhr = MockXHR.instance

    xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 })
    expect(onProgress).toHaveBeenCalledWith(50)

    xhr.responseText = JSON.stringify({ fileId: '123' })
    xhr.onload()

    const result = await promise
    expect(result).toEqual({ fileId: '123' })
  })

  it('deve rejeitar upload com 401 e chamar signOut', async () => {
    const file = new File([''], 'empty.txt')
    const promise = api.upload('/fail', file, vi.fn())
    
    const xhr = MockXHR.instance
    xhr.status = 401
    xhr.responseText = 'Unauthorized'
    xhr.onload()

    await expect(promise).rejects.toBe('Unauthorized')
    expect(signOut).toHaveBeenCalled()
  })

  it('deve falhar se o progresso não for computável', async () => {
    const onProgress = vi.fn()
    api.upload('/up', new File([], 'f'), onProgress)
    MockXHR.instance.upload.onprogress({ lengthComputable: false })
    expect(onProgress).not.toHaveBeenCalled()
  })
})