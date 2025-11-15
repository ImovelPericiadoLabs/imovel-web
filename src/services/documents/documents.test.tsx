import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { uploadDocument } from './documents'

vi.mock('@/utils/api/client')

describe('uploadDocument service', () => {
  const mockApiPost = api.post as Mock

  beforeEach(() => {
    mockApiPost.mockClear()
  })

  it('should create FormData and call api.post with the correct data', async () => {
    const mockFile = new File(['file content'], 'document.pdf', {
      type: 'application/pdf',
    })
    const mockApiResponse = { id: 'doc-123', path: '/uploads/document.pdf' }

    mockApiPost.mockResolvedValue(mockApiResponse)

    const result = await uploadDocument(mockFile)

    expect(mockApiPost).toHaveBeenCalledTimes(1)

    const endpointCalled = mockApiPost.mock.calls[0][0]
    const formDataSent = mockApiPost.mock.calls[0][1] as FormData

    expect(endpointCalled).toBe(endpoint.documents.upload)
    expect(formDataSent).toBeInstanceOf(FormData)

    const fileInFormData = formDataSent.get('file_path') as File
    expect(fileInFormData.name).toBe('document.pdf')
    expect(fileInFormData.type).toBe('application/pdf')

    expect(result).toEqual(mockApiResponse)
  })
})
