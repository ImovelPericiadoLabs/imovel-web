import { z } from 'zod'

const DocumentTypeEnum = z.enum(['contract', 'registration', 'deed'])

export const validations = z
  .object({
    address: z.string().min(5, 'Digite um endereço válido').nonempty('O endereço é obrigatório'),
    hasDocument: z.any(),
    documentType: DocumentTypeEnum.optional(),
    document: z.object({
      id: z.string(),
      file_path: z.string().url(),
      file_hash: z.string(),
      original_name: z.string(),
      extension: z.string(),
    }),
  })
  .refine(
    (data) => {
      if (data.hasDocument) {
        return !!data.document
      }
      return true
    },
    {
      message: 'O documento é obrigatório',
      path: ['document'],
    },
  )

export type FormTypes = z.infer<typeof validations>
