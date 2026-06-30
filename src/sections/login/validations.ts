import { z } from 'zod'

export const validations = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Digite um e-mail válido'),
  code: z.string().min(6, 'O código deve ter 6 dígitos'),
})

export type FormTypes = z.infer<typeof validations>