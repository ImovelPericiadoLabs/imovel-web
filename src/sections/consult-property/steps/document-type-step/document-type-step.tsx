import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'

export function DocumentTypeStep() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <TextTitle>Qual documento você tem?</TextTitle>
        <TextSubtitle>Selecione uma das opções abaixo</TextSubtitle>
      </div>
    </div>
  )
}
