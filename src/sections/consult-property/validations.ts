import { z } from 'zod'

const DocumentTypeEnum = z.enum(['contract', 'registration', 'deed'])

export const validations = z
  .object({
    address: z.string().min(3, 'Digite um endereço válido').nonempty('O endereço é obrigatório'),
    placeId: z.string(),
    registry: z.object({
      id: z.string().uuid(),
      name: z.string(),
      number: z.number(),
      slug: z.string(),
      coverage: z.array(z.string()),
    }),
    hasDocument: z.any(),
    documentType: DocumentTypeEnum.optional(),
    document: z.object({
      id: z.string(),
      file_path: z.string(),
      file_hash: z.string(),
      original_name: z.string(),
      extension: z.string(),
    }),
    paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'boleto']),
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
