// src/types/formContext.ts
import type { UseFormReturn } from 'react-hook-form'

export type FormContextWithSteps = UseFormReturn & {
  handleNextStep: () => void
  setStep: (step: number) => void
  setHasDocument: (hasDocument: boolean) => void
}
