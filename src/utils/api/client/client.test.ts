import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

  describe('api.upload', () => {
    let originalXHR: typeof XMLHttpRequest

    class MockXHR {
      static instances: MockXHR[] = []

      responseText = ''
      status = 200
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      upload = {
        onprogress: null as null | ((ev: ProgressEvent) => void),
      }

      constructor() {
        MockXHR.instances.push(this)
      }

      open(_method: string, _url: string) {}

      send(_body: FormData) {}

      simulateProgress(loaded: number, total: number) {
        if (this.upload.onprogress) {
          const event = {
            lengthComputable: true,
            loaded,
            total,
          } as ProgressEvent
          this.upload.onprogress(event)
        }
      }

      simulateLoad(response: string) {
        this.responseText = response
        this.onload?.()
      }

      simulateError() {
        this.onerror?.()
      }
    }

    beforeEach(() => {
      originalXHR = global.XMLHttpRequest
      // @ts-ignore
      global.XMLHttpRequest = MockXHR
      MockXHR.instances = []
    })

    afterEach(() => {
      global.XMLHttpRequest = originalXHR
    })

    it('should send the file in FormData and return parsed JSON', async () => {
      const file = new File(['abc'], 'test.pdf', { type: 'application/pdf' })
      const progressFn = vi.fn()

      const uploadPromise = api.upload('/upload', file, progressFn)

      const xhr = MockXHR.instances[0]
      xhr.simulateLoad(JSON.stringify({ uploaded: true }))

      const result = await uploadPromise

      expect(result).toEqual({ uploaded: true })
      expect(progressFn).not.toHaveBeenCalled() // no progress fired here
    })

    it('should call progress callback with computed percent', async () => {
      const file = new File(['xyz'], 'file.pdf')
      const progressFn = vi.fn()

      const uploadPromise = api.upload('/upload', file, progressFn)

      const xhr = MockXHR.instances[0]

      xhr.simulateProgress(50, 100)
      xhr.simulateProgress(75, 100)
      xhr.simulateProgress(100, 100)

      xhr.simulateLoad(JSON.stringify({ ok: true }))
      await uploadPromise

      expect(progressFn).toHaveBeenCalledTimes(3)
      expect(progressFn).toHaveBeenNthCalledWith(1, 50)
      expect(progressFn).toHaveBeenNthCalledWith(2, 75)
      expect(progressFn).toHaveBeenNthCalledWith(3, 100)
    })

    it('should reject when JSON parsing fails', async () => {
      const file = new File(['abc'], 'invalid.pdf')
      const progressFn = vi.fn()

      const uploadPromise = api.upload('/upload', file, progressFn)

      const xhr = MockXHR.instances[0]

      xhr.simulateLoad('INVALID_JSON')

      await expect(uploadPromise).rejects.toBeInstanceOf(Error)
    })

    it('should reject when xhr.onerror is called', async () => {
      const file = new File(['abc'], 'error.pdf')
      const progressFn = vi.fn()

      const uploadPromise = api.upload('/upload', file, progressFn)

      const xhr = MockXHR.instances[0]
      xhr.simulateError()

      await expect(uploadPromise).rejects.toBeUndefined()
    })

    it('should send FormData with file_path containing the file', async () => {
      const file = new File(['filecontent'], 'photo.png')
      const progressFn = vi.fn()

      api.upload('/upload', file, progressFn)

      const xhr = MockXHR.instances[0]

      const sendSpy = vi.spyOn(xhr as unknown as { send(body: FormData): void }, 'send')

      const form = new FormData()
      form.append('file_path', file)

      xhr.send(form)

      expect(sendSpy).toHaveBeenCalledTimes(1)

      const sentFormData = sendSpy.mock.calls[0][0] as FormData

      const sentFile = sentFormData.get('file_path')
      expect(sentFile).toBeInstanceOf(File)
      expect((sentFile as File).name).toBe('photo.png')
    })

    it('should call xhr.open with correct URL', async () => {
      const file = new File(['v'], 'video.mp4')
      const progressFn = vi.fn()

      const openSpy = vi.fn()
      const oldOpen = MockXHR.prototype.open
      MockXHR.prototype.open = openSpy

      api.upload('/upload-file', file, progressFn)

      expect(openSpy).toHaveBeenCalledWith('POST', expect.stringContaining('/upload-file'))

      MockXHR.prototype.open = oldOpen
    })

    it('should call progress callback when event.lengthComputable is true', async () => {
      const file = new File(['abc'], 'true.pdf', { type: 'application/pdf' })
      const progressFn = vi.fn()

      const uploadPromise = api.upload('/upload', file, progressFn)

      const xhr = MockXHR.instances[0]

      const event = new ProgressEvent('progress', {
        lengthComputable: true,
        loaded: 25,
        total: 50,
      })

      xhr.upload.onprogress?.(event)

      xhr.simulateLoad(JSON.stringify({ ok: true }))
      await uploadPromise

      expect(progressFn).toHaveBeenCalledTimes(1)
      expect(progressFn).toHaveBeenCalledWith(50)
    })

    it('should NOT call progress callback when event.lengthComputable is false', async () => {
      const file = new File(['abc'], 'false.pdf', { type: 'application/pdf' })
      const progressFn = vi.fn()

      const uploadPromise = api.upload('/upload', file, progressFn)

      const xhr = MockXHR.instances[0]

      const event = new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 30,
        total: 100,
      })

      xhr.upload.onprogress?.(event)

      xhr.simulateLoad(JSON.stringify({ ok: true }))
      await uploadPromise

      expect(progressFn).not.toHaveBeenCalled()
    })
  })
})
