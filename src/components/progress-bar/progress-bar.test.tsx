import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressBar from './progerss-bar'

describe('ProgressBar', () => {
  it('should render the progress bar', () => {
    render(<ProgressBar value={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    const bar = screen.getByRole('progressbar')
    expect(bar.className).toContain('h-full')
    expect(bar.className).toContain('rounded')
    expect(bar.className).toContain('bg-white')
  })

  it('should set the correct width based on value', () => {
    render(<ProgressBar value={50} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '50%' })
  })

  it('should not exceed 100% when value is greater than 100', () => {
    render(<ProgressBar value={150} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '100%' })
  })

  it('should not go below 0% when value is less than 0', () => {
    render(<ProgressBar value={-30} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '0%' })
  })
})
