import { z } from 'zod'

export const validations = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Digite um e-mail válido'),
})

export type FormTypes = z.infer<typeof validations>