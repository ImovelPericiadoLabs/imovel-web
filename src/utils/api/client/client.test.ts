import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from './client'

const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

const mockJson = (data: object, status = 200) =>
  Promise.resolve({
    status,
    json: () => Promise.resolve(data),
  })

const mockText = (data: string, status = 200) =>
  Promise.resolve({
    status,
    text: () => Promise.resolve(data),
  })

beforeEach(() => {
  mockFetch.mockReset()
})

describe('api.get', () => {
  it('should perform GET and return JSON data', async () => {
    mockFetch.mockResolvedValue(mockJson({ ok: true }))

    const result = await api.get('/test')

    expect(result).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockJson({ error: 'Unauthorized' }, 401))

    await expect(api.get('/test')).rejects.toEqual({ error: 'Unauthorized' })
  })
})

describe('api.post', () => {
  it('should perform POST and return JSON data', async () => {
    mockFetch.mockResolvedValue(mockJson({ created: true }))

    const body = { name: 'Test' }
    const result = await api.post('/test', body)

    expect(result).toEqual({ created: true })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(body),
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockJson({ error: 'Unauthorized' }, 401))

    await expect(api.post('/test', {})).rejects.toEqual({ error: 'Unauthorized' })
  })
})

describe('api.put', () => {
  it('should perform PUT and return text response', async () => {
    mockFetch.mockResolvedValue(mockText('updated'))

    const result = await api.put('/test', { value: 'A' })

    expect(result).toBe('updated')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ value: 'A' }),
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockText('error', 401))

    await expect(api.put('/test', {})).rejects.toBe('error')
  })
})

describe('api.delete', () => {
  it('should perform DELETE and return text response', async () => {
    mockFetch.mockResolvedValue(mockText('deleted'))

    const result = await api.delete('/test')

    expect(result).toBe('deleted')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/test'), {
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    })
  })

  it('should throw when status is 401', async () => {
    mockFetch.mockResolvedValue(mockText('unauthorized', 401))

    await expect(api.delete('/test')).rejects.toBe('unauthorized')
  })
})
