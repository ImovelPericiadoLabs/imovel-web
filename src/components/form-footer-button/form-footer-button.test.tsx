// Salve em: /components/form-footer-button/form-footer-button.test.tsx

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest' // <-- Importando de 'vitest'
import '@testing-library/jest-dom'
import FormFooterButton from './form-footer-button' // <-- Importando o default

// Mock do utilitário 'cn'
vi.mock('@/utils/tailwind', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

// Mock do seu componente 'Button' base, seguindo seu exemplo
vi.mock('@/components/button', () => ({
  __esModule: true,
  default: ({
    children,
    className,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      className={className}
      {...rest} // Passa onClick, disabled, type, etc.
      data-testid="mock-button" // Usamos um test-id para o botão mockado
    >
      {children}
    </button>
  ),
}))

describe('FormFooterButton', () => {
  it('renderiza o botão com o texto correto', () => {
    render(
      <FormFooterButton onClick={() => { }}>Continuar</FormFooterButton>,
    )
    // Procuramos pelo botão mockado e vemos se ele tem o texto
    expect(screen.getByTestId('mock-button')).toHaveTextContent('Continuar')
  })

  it('chama a função onClick ao ser clicado', () => {
    const handleClick = vi.fn() // <-- Usando vi.fn()
    render(<FormFooterButton onClick={handleClick}>Avançar</FormFooterButton>)

    const button = screen.getByTestId('mock-button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('desabilita o botão e não chama o onClick', () => {
    const handleClick = vi.fn() // <-- Usando vi.fn()
    render(
      <FormFooterButton onClick={handleClick} disabled>
        Enviar
      </FormFooterButton>,
    )

    const button = screen.getByTestId('mock-button')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('aplica as classes de layout corretas ao mock do botão', () => {
    render(
      <FormFooterButton onClick={() => { }} className="extra-class">
        Test
      </FormFooterButton>,
    )

    const button = screen.getByTestId('mock-button')
    const classList = button.className

    // Verifica se as classes do FormFooterButton (h-13, md:w-auto, etc.)
    // foram passadas para o componente <Button> mockado.
    expect(classList).toContain('h-13')
    expect(classList).toContain('md:w-auto')
    expect(classList).toContain('md:px-10')
    expect(classList).toContain('extra-class')
  })

  it('renderiza o contêiner com as classes responsivas corretas', () => {
    render(
      <FormFooterButton onClick={() => { }}>Test</FormFooterButton>,
    )

    // Testa o 'div' pai
    const container = screen.getByTestId('footer-container')
    expect(container.className).toContain('fixed bottom-0')
    expect(container.className).toContain('md:static')
    expect(container.className).toContain('md:p-0')
  })
})