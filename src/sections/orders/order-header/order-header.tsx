import { MapPin } from 'lucide-react'
import TrafficLight from '@/components/traffic-light'
import { formatDateWithTime } from '@/utils/date'

type Props = {
  Badge?: React.ReactNode
  code?: number | string
  created?: string
  address?: string | null
  analysisStatus?: string 
}

export default function OrderHeader({ Badge, code, created, address, analysisStatus }: Props) {
  const displayId = code ? `#${String(code).padStart(6, '0')}` : '...'

  const isApproved = analysisStatus === 'APPROVED'
  const isRejected = analysisStatus === 'REJECTED'
  const isPending = !isApproved && !isRejected

  return (
    <div className="flex flex-col gap-6 px-3 py-4 mb-3 bg-background">
      <div className="flex align-middle justify-between w-full mx-auto lg:max-w-lg">
        <p className="text-base font-semibold leading-[130%] self-center">{displayId}</p>

        <div className="flex flex-col">
          <p className="text-gray-2 text-[0.65rem] font-normal leading-[130%] self-end">
            Solicitado em
          </p>

          <p className="text-base font-semibold leading-[130%]">
            {created ? formatDateWithTime(created) : '...'}
          </p>
        </div>
      </div>

      <div className="bg-box rounded-sm px-4 py-5 w-full mx-auto lg:max-w-lg">
        <div className="flex gap-4">
          <MapPin className="size-6 shrink-0" />

          <p className="text-xs font-normal leading-[130%]">
            {address || 'Endereço não informado'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center align-middle justify-center">
        <TrafficLight
          red={isRejected}
          green={isApproved}
          yellow={isPending}
        />
        {!!Badge && Badge}
      </div>
    </div>
  )
}