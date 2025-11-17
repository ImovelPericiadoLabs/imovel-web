import { describe, it, expect, vi, Mock } from 'vitest'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { uploadDocument } from './documents'

vi.mock('@/utils/api/client', () => ({
  default: {
    upload: vi.fn(),
  },
}))

const mockApiUpload = api.upload as Mock<
  (url: string, file: File, progress: (p: number) => void) => Promise<unknown>
>

describe('uploadDocument service', () => {
  it('should call api.upload with the correct arguments', async () => {
    const file = new File(['hello'], 'file.pdf', { type: 'application/pdf' })
    const progressFn = vi.fn()

    mockApiUpload.mockResolvedValue({ ok: true })

    const result = await uploadDocument(file, progressFn)

    expect(mockApiUpload).toHaveBeenCalledTimes(1)

    const [url, passedFile, passedProgress] = mockApiUpload.mock.calls[0]

    expect(url).toBe(endpoint.documents.upload)
    expect(passedFile).toBeInstanceOf(File)
    expect(passedFile.name).toBe('file.pdf')
    expect(typeof passedProgress).toBe('function')

    expect(result).toEqual({ ok: true })
  })

  it('should propagate errors thrown by api.upload', async () => {
    const file = new File(['err'], 'err.pdf', { type: 'application/pdf' })
    const progressFn = vi.fn()
    const error = new Error('Something went wrong')

    mockApiUpload.mockRejectedValue(error)

    await expect(uploadDocument(file, progressFn)).rejects.toThrow('Something went wrong')
  })

  it('should forward the progress callback to api.upload', async () => {
    const file = new File(['123'], 'doc.pdf', { type: 'application/pdf' })
    const progressFn = vi.fn()

    mockApiUpload.mockImplementation(async (_url, _file, onProgress) => {
      onProgress(15)
      onProgress(55)
      onProgress(100)
      return { done: true }
    })

    await uploadDocument(file, progressFn)

    expect(progressFn).toHaveBeenCalledTimes(3)
    expect(progressFn).toHaveBeenNthCalledWith(1, 15)
    expect(progressFn).toHaveBeenNthCalledWith(2, 55)
    expect(progressFn).toHaveBeenNthCalledWith(3, 100)
  })
})
