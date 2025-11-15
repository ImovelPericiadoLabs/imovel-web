import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from './client'

const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

const mockJsonResponse = (data: object, status = 200, ok = status < 400) =>
  Promise.resolve({
    status,
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })

const mockTextResponse = (data: string, status = 200, ok = status < 400) =>
  Promise.resolve({
    status,
    ok,
    json: () => Promise.reject(new Error('Não é um JSON válido')),
    text: () => Promise.resolve(data),
  })

beforeEach(() => {
  mockFetch.mockReset()
})

describe('api.get', () => {
  it('should perform GET and return JSON data', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ ok: true }))

    const result = await api.get('/test')

    expect(result).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Unauthorized' }, 401))

    await expect(api.get('/test')).rejects.toEqual({ error: 'Unauthorized' })
  })
})

describe('api.post', () => {
  it('should perform POST with JSON body and return JSON data', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ created: true }))

    const body = { name: 'Test' }
    const result = await api.post('/test', body)

    expect(result).toEqual({ created: true })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(body),
    })
  })

  it('should handle FormData correctly without setting a Content-Type header', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ uploaded: true }))

    const formData = new FormData()
    formData.append('file', new Blob(['file content']), 'file.txt')

    await api.post('/upload', formData)

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/upload'), {
      method: 'POST',
      headers: {},
      body: formData,
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Unauthorized' }, 401))

    await expect(api.post('/test', {})).rejects.toEqual({ error: 'Unauthorized' })
  })
})

describe('api.put', () => {
  it('should perform PUT and return text response', async () => {
    mockFetch.mockResolvedValue(mockTextResponse('updated'))

    const result = await api.put('/test', { value: 'A' })

    expect(result).toBe('updated')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ value: 'A' }),
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockTextResponse('error', 401))

    await expect(api.put('/test', {})).rejects.toBe('error')
  })
})

describe('api.delete', () => {
  it('should perform DELETE and return text response', async () => {
    mockFetch.mockResolvedValue(mockTextResponse('deleted'))

    const result = await api.delete('/test')

    expect(result).toBe('deleted')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockTextResponse('unauthorized', 401))

    await expect(api.delete('/test')).rejects.toBe('unauthorized')
  })
})
