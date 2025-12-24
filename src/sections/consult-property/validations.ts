import { z } from 'zod'

const DocumentTypeEnum = z.enum(['agreement', 'registration', 'deed'])

export const validations = z
  .object({
    address: z.string().min(3, 'Digite um endereço válido').nonempty('O endereço é obrigatório'),
    addressComplement: z.string().optional(),
    unknownRegistration: z.boolean().optional(),
    registrationNumber: z.string().optional(),
    noComplement: z.boolean().optional(),
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
    document: z
      .object({
        id: z.string(),
        file_path: z.string(),
        file_hash: z.string(),
        original_name: z.string(),
        extension: z.string(),
      })
      .optional(),
    paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'boleto']),
  })
  .refine(
    (data) => {
      if (data.hasDocument) {
        return !!data.document && !!data.document.id
      }
      return true
    },
    {
      message: 'O documento é obrigatório',
      path: ['document'],
    },
  )
  .refine(
    (data) => {
      if (!data.unknownRegistration) {
        return !!data.registrationNumber && data.registrationNumber.length > 0
      }
      return true
    },
    {
      message: 'Campo obrigatório',
      path: ['registrationNumber'],
    }
  )
  .refine(
    (data) => {
      if (!data.noComplement) {
        return !!data.addressComplement && data.addressComplement.length > 0
      }
      return true
    },
    {
      message: 'Campo obrigatório',
      path: ['addressComplement'],
    }
  )

export type FormTypes = z.infer<typeof validations>
