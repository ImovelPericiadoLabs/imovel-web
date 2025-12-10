import { Check, Cpu, MessageCircle, FileSearch } from 'lucide-react'
import Button from '@/components/button'

interface SuccessStepProps {
  onNavigateToOrders: () => void
}

export function SuccessStep({ onNavigateToOrders }: SuccessStepProps) {
  return (
    <div className="w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-8">
      
      {/* CARD PRINCIPAL - Branco Limpo com Sombra */}
      {/* Adicionei 'pb-8' para dar respiro no final da lista agora que o botão saiu */}
      <div className="bg-white rounded-3xl p-6 pt-12 pb-8 shadow-xl relative flex flex-col items-center text-center mt-6">
        
        {/* Ícone de Sucesso Flutuante (Somente círculo verde) */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <div className="relative">
            {/* Brilho verde atrás do ícone */}
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
            
            {/* Círculo do ícone */}
            <div className="relative size-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="text-white size-10 stroke-[3]" />
            </div>
          </div>
        </div>
        
        {/* Título e Subtítulo */}
        <h2 className="text-2xl font-bold text-dark mt-4 mb-2">
          Pagamento Recebido!
        </h2>
        <p className="text-gray-500 text-sm max-w-[260px] leading-relaxed">
          Sua solicitação de perícia foi iniciada com sucesso.
        </p>

        {/* Divisor Sutil */}
        <div className="w-full h-px bg-gray-100 my-6"></div>

        {/* Timeline de Próximos Passos */}
        <div className="w-full text-left">
          <h3 className="text-dark font-semibold text-base mb-6 pl-1">
            Próximas etapas:
          </h3>

          {/* Linha vertical da timeline */}
          <div className="relative space-y-8 pl-4 before:absolute before:left-[23px] before:top-2 before:h-[calc(100%-20px)] before:w-0.5 before:bg-gray-100">
            
            {/* Passo 1 - Tecnologia (Ativo - Verde) */}
            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                <Cpu className="size-5 text-emerald-600" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-semibold text-emerald-900 text-sm">Análise Tecnológica</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Nossa tecnologia já está cruzando os dados para gerar a perícia detalhada do imóvel.
                </p>
              </div>
            </div>

            {/* Passo 2 - Notificações (Pendente - Cinza) */}
            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <MessageCircle className="size-5 text-gray-400" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-medium text-gray-700 text-sm">Notificações</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Você receberá atualizações do progresso da análise diretamente no seu WhatsApp.
                </p>
              </div>
            </div>

            {/* Passo 3 - Resultado (Pendente - Cinza) */}
            <div className="relative flex gap-4 items-start">
              <div className="z-10 relative flex-shrink-0 size-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <FileSearch className="size-5 text-gray-400" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="font-medium text-gray-700 text-sm">Resultado Final</span>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Assim que finalizado, o laudo completo estará disponível na sua área de pedidos.
                </p>
              </div>
            </div>

          </div>
        </div>
        
      </div>

      {/* BOTÃO FORA DA BOX (Agora ocupa a largura total fora do card) */}
      <div className="w-full mt-6">
        <Button 
          onClick={onNavigateToOrders} 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98]"
        >
          Acompanhar meus pedidos
        </Button>
      </div>

    </div>
  )
}