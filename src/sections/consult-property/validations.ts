import { z } from 'zod'

const DocumentTypeEnum = z.enum(['contract', 'registration', 'deed'])

export const validations = z
  .object({
    address: z
      .string()
      .min(5, 'Digite um endereço válido')
      .nonempty('O endereço é obrigatório'),
    hasDocument: z
      .any()
      .refine((val): val is boolean => typeof val === 'boolean', {
        message: 'Selecione uma opção para continuar.',
      }),

    documentType: DocumentTypeEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasDocument === true && !data.documentType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documentType'],
        message: 'Por favor, selecione o tipo de documento que você possui.',
      })
    }
  })

export type FormTypes = z.infer<typeof validations>