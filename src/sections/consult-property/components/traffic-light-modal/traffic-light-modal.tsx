import { Fragment, PropsWithChildren } from 'react'
import Modal from '@/components/modal'

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
          <div className="flex items-center justify-center w-full pt-10 bg-background">
            <div className="flex flex-col gap-3.5 items-center justify-center bg-[#345274] border border-b-none border-[#233D5A] w-18 h-36 rounded-t-sm">
              <div className="rounded-full bg-red-600 size-6" />
              <div className="rounded-full bg-yellow-300 size-6" />
              <div className="rounded-full bg-green-500 size-6" />
            </div>
          </div>

          <div className="flex gap-3 flex-col px-4 py-6">
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
