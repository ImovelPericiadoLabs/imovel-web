import React from 'react'
import { cn } from '@/utils/tailwind'

export type ProgressBarProps = {
  value: number
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className }) => {
  const percentage = `${Math.min(Math.max(value, 0), 100)}%`
  return (
    <div className={cn('flex w-full relative flex-row items-center', className)}>
      <div
        style={{
          width: '100%',
          height: '0.5rem',
          backgroundColor: '#9A77E9',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          role="progressbar"
          className={'h-full rounded bg-white'}
          style={{
            borderRadius: '0.5rem',
            width: percentage,
          }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
