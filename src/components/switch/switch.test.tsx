import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from './switch'
import { describe, it, expect, vi } from 'vitest'

describe('Switch Component', () => {
  it('deve renderizar corretamente', () => {
    render(<Switch />)
    const switchButton = screen.getByRole('switch')
    expect(switchButton).toBeInTheDocument()
  })

  it('deve ter o estado inicial "unchecked" por padrão', () => {
    render(<Switch />)
    const switchButton = screen.getByRole('switch')
    expect(switchButton).toHaveAttribute('aria-checked', 'false')
    expect(switchButton).toHaveAttribute('data-state', 'unchecked')
  })

  it('deve refletir a prop "checked" como true', () => {
    render(<Switch checked={true} />)
    const switchButton = screen.getByRole('switch')
    expect(switchButton).toHaveAttribute('aria-checked', 'true')
    const thumb = switchButton.querySelector('span')
    expect(thumb).toHaveAttribute('data-state', 'checked')
  })

  it('deve chamar a função onCheckedChange com o novo valor ao clicar', () => {
    const handleCheckedChange = vi.fn()
    render(<Switch checked={false} onCheckedChange={handleCheckedChange} />)

    const switchButton = screen.getByRole('switch')
    fireEvent.click(switchButton)

    expect(handleCheckedChange).toHaveBeenCalledTimes(1)
    expect(handleCheckedChange).toHaveBeenCalledWith(true)
  })

  it('deve chamar a função onCheckedChange com false se estava true', () => {
    const handleCheckedChange = vi.fn()
    render(<Switch checked={true} onCheckedChange={handleCheckedChange} />)

    const switchButton = screen.getByRole('switch')
    fireEvent.click(switchButton)

    expect(handleCheckedChange).toHaveBeenCalledWith(false)
  })

  it('não deve chamar onCheckedChange quando estiver desabilitado', () => {
    const handleCheckedChange = vi.fn()
    render(<Switch disabled onCheckedChange={handleCheckedChange} />)

    const switchButton = screen.getByRole('switch')
    expect(switchButton).toBeDisabled()

    fireEvent.click(switchButton)
    expect(handleCheckedChange).not.toHaveBeenCalled()
  })

  it('deve aplicar classes customizadas passadas via className', () => {
    render(<Switch className="custom-class" />)
    const switchButton = screen.getByRole('switch')
    expect(switchButton).toHaveClass('custom-class')
  })
})