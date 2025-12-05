import { PropsWithChildren } from 'react'

export default function HeaderTitle({ children }: PropsWithChildren) {
  return <h1 className="text-white text-sm font-bold leading-6">{children}</h1>
}
