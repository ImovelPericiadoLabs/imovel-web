import { PropsWithChildren } from 'react'

export default function consultaLayout({ children }: PropsWithChildren) {
  return <div className="flex flex-col">{children}</div>
}
