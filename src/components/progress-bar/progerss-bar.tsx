import React from 'react'

export type ProgressBarProps = {
  value: number
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const percentage = `${Math.min(Math.max(value, 0), 100)}%`
  return (
    <div className={'flex w-full relative flex-row items-center'}>
      <div
        style={{
          width: '100%',
          height: '0.5rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <div
          role="progressbar"
          className={'h-full rounded bg-primary'}
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
