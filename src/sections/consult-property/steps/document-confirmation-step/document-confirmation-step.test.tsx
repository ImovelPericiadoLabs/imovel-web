import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DocumentConfirmationStep } from './document-confirmation-step'

// --- Mocks ---

// Mock das funções que o useFormContext vai retornar
const setValueMock = vi.fn()
const handleNextStepMock = vi.fn()

// Mock do react-hook-form
vi.mock('react-hook-form', () => ({
  useFormContext: () => ({
    setValue: setValueMock,
    handleNextStep: handleNextStepMock,
  }),
}))

// Mock dos componentes
type TextTitleProps = {
  children: React.ReactNode
}
vi.mock('@/components/text-title', () => ({
  __esModule: true,
  default: ({ children }: TextTitleProps) => (
    <h1 data-testid="text-title">{children}</h1>
  ),
}))

type ButtonProps = {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}
vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }: ButtonProps) => (
    <button data-testid="button-continuar" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

// Mock dos ícones
vi.mock('lucide-react', () => ({
  ThumbsUp: () => <span data-testid="icon-thumbs-up" />,
  ThumbsDown: () => <span data-testid="icon-thumbs-down" />,
}))

// --- Setup ---
// Renderiza o componente e busca os elementos
const setup = () => {
  // Limpa os mocks antes de cada teste
  setValueMock.mockClear()
  handleNextStepMock.mockClear()

  render(<DocumentConfirmationStep />) // Componente não recebe mais props

  const optionYes = screen.getByText('Sim, eu tenho').closest('div')!
  const optionNo = screen.getByText('Não tenho').closest('div')!
  const continueButton = screen.getByRole('button', { name: /continuar/i })

  return {
    optionYes,
    optionNo,
    continueButton,
    // Retorna os mocks para verificar se foram chamados
    setValueMock,
    handleNextStepMock,
  }
}

describe('DocumentConfirmationStep', () => {
  describe('Renderização Inicial', () => {
    it('should render the title and options correctly', () => {
      setup()
      const title = screen.getByTestId('text-title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Você tem o documento do imóvel?')
      expect(screen.getByText('Sim, eu tenho')).toBeInTheDocument()
      expect(screen.getByText('Não tenho')).toBeInTheDocument()
    })

    it('should render the "Continuar" button as disabled by default', () => {
      const { continueButton } = setup()
      expect(continueButton).toBeInTheDocument()
      expect(continueButton).toBeDisabled()
    })
  })

  describe('Interação do Usuário', () => {
    it('should enable the "Continuar" button when "Sim, eu tenho" is selected', () => {
      const { optionYes, continueButton } = setup()

      expect(continueButton).toBeDisabled()
      fireEvent.click(optionYes)
      expect(continueButton).toBeEnabled()
      expect(optionYes).toHaveClass('border-primary')
    })

    it('should enable the "Continuar" button when "Não tenho" is selected', () => {
      const { optionNo, continueButton } = setup()

      expect(continueButton).toBeDisabled()
      fireEvent.click(optionNo)
      expect(continueButton).toBeEnabled()
      expect(optionNo).toHaveClass('border-primary')
    })

    it('should toggle selection correctly when changing options', () => {
      const { optionYes, optionNo, continueButton } = setup()

      fireEvent.click(optionYes)
      expect(optionYes).toHaveClass('border-primary')
      expect(optionNo).not.toHaveClass('border-primary')

      fireEvent.click(optionNo)
      expect(optionYes).not.toHaveClass('border-primary')
      expect(optionNo).toHaveClass('border-primary')
    })
  })

  describe('Submissão (Form Context)', () => {
    it('should call setValue with { hasDocument: true } and handleNextStep when "Sim" is selected', () => {
      const { optionYes, continueButton, setValueMock, handleNextStepMock } =
        setup()

      fireEvent.click(optionYes)
      fireEvent.click(continueButton)

      expect(setValueMock).toHaveBeenCalledTimes(1)
      expect(setValueMock).toHaveBeenCalledWith('hasDocument', true)
      expect(handleNextStepMock).toHaveBeenCalledTimes(1)
    })

    it('should call setValue with { hasDocument: false } and handleNextStep when "Não" is selected', () => {
      const { optionNo, continueButton, setValueMock, handleNextStepMock } =
        setup()

      fireEvent.click(optionNo)
      fireEvent.click(continueButton)

      expect(setValueMock).toHaveBeenCalledTimes(1)
      expect(setValueMock).toHaveBeenCalledWith('hasDocument', false)
      expect(handleNextStepMock).toHaveBeenCalledTimes(1)
    })

    it('should not call setValue or handleNextStep if no option is selected', () => {
      const { continueButton, setValueMock, handleNextStepMock } = setup()

      expect(continueButton).toBeDisabled()

      // Testa a guarda interna do handleSubmit (if (!selectedOption) return)
      fireEvent.click(continueButton)

      expect(setValueMock).not.toHaveBeenCalled()
      expect(handleNextStepMock).not.toHaveBeenCalled()
    })
  })
})