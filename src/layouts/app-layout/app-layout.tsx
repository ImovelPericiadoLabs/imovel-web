import { PropsWithChildren } from 'react'
import Image from 'next/image'
import { ChevronLeft, Menu } from 'lucide-react'
import WhatsAppIcon from '@/components/icons/whatsapp-icon/whatsapp-icon'

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <section className="min-h-screen bg-background">
      <header className="flex flex-col pt-4 px-4 bg-primary relative z-40">
        <div className="flex items-center justify-between py-4.5 mb-6">
          <ChevronLeft className={'size-7 text-white cursor-pointer'} role="button" />

          <div className="relative">
            <Image src="/images/logo-mini.png" alt="Logo" width={30} height={50} />
          </div>

          <div className="flex gap-2">
            <WhatsAppIcon className="cursor-pointer size-7 text-white" />
            <Menu className="cursor-pointer size-7 text-white" />
          </div>
        </div>
      </header>
      {children}
    </section>
  )
}
