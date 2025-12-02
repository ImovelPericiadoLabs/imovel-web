import { Fragment, PropsWithChildren } from 'react'
import Modal from '@/components/modal'
import TrafficLight from '@/components/traffic-light'

export default function TrafficLightModal({ children }: PropsWithChildren) {
  const trafficsLightExplanation = [
    {
      color: 'bg-red-600',
      title: 'Impeditivo de compra e venda',
      description: 'Pendência detectada. Necessária regularização imediata.',
    },
    {
      color: 'bg-yellow-300',
      title: 'Irregularidades encontradas',
      description: 'Existem inconsistências que precisam ser verificadas.',
    },
    {
      color: 'bg-green-500',
      title: 'Tudo Certo!',
      description: 'Sem problemas. Pode seguir com a operação.',
    },
  ]

  return (
    <Modal
      title="Como funciona?"
      content={
        <div className="flex flex-col">
          <div className="flex items-center justify-center w-full py-14 bg-background">
            <TrafficLight />
          </div>

          <div className="flex gap-3 flex-col px-4 py-6 rounded-t-sm border-t border-box">
            <p className="text-base font-semibold leading-[130%]">O semáforo</p>

            <hr className="border border-box" />

            <p className="text-xs font-normal leading-[150%]">
              Usamos o sistema de semáforo para ajudar você a entender, de primeira, o status do seu
              imóvel. Ele mostra de forma rápida se está tudo certo, se precisa de atenção ou se é
              preciso parar antes de seguir. Simples e direto.
            </p>
          </div>

          <hr className="border border-box" />

          {trafficsLightExplanation.map((item, index) => {
            return (
              <Fragment key={item.title}>
                <div className="flex flex-col gap-2 px-4 py-5">
                  <div className="flex gap-2 items-center">
                    <div className={`rounded-full ${item.color} size-2`} />
                    <p className="text-sm font-semibold leading-[130%]">{item.title}</p>
                  </div>

                  <p className="text-gray-2 text-xs font-normal leading-[130%]">
                    {item.description}
                  </p>
                </div>
                {index < trafficsLightExplanation.length - 1 && (
                  <hr className="border border-box" />
                )}
              </Fragment>
            )
          })}
        </div>
      }
    >
      {children}
    </Modal>
  )
}
