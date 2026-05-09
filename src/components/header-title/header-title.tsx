import { PropsWithChildren } from 'react'

export default function HeaderTitle({ children }: PropsWithChildren) {
  return (
    <h1 className="text-white text-sm font-bold leading-6 text-center whitespace-nowrap truncate max-w-full">
      {children}
    </h1>
  )
}
