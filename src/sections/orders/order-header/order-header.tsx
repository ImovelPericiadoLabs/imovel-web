import { MapPin } from 'lucide-react'
import TrafficLight from '@/components/traffic-light'

type Props = {
  Badge?: React.ReactNode
}

export default function OrderHeader({ Badge }: Props) {
  return (
    <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background">
      <div className="flex align-middle justify-between">
        <p className="text-base font-semibold leading-[130%] self-center">#000001</p>

        <div className="flex flex-col">
          <p className="text-gray-2 text-[0.65rem] font-normal leading-[130%] self-end">
            Solicitado em
          </p>

          <p className="text-base font-semibold leading-[130%]">26/11/2025 16:23</p>
        </div>
      </div>

      <div className="bg-box rounded-sm px-4 py-5">
        <div className="flex gap-4">
          <MapPin className="size-6" />

          <p className="text-xs font-normal leading-[130%]">
            Rua Pamplona, 1593, Jardim Paulista, São Paulo, SP, CEP 01405-002.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center align-middle justify-center">
        <TrafficLight red />
        {!!Badge && Badge}
      </div>
    </div>
  )
}
