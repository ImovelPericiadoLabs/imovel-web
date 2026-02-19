import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AddressComplementStep } from './AddressComplementStep'
import { FormProvider, useForm } from 'react-hook-form'

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      address: 'Mock Address',
      unknownRegistration: undefined,
      noAllotment: undefined,
      noBlock: undefined,
      noLot: undefined,
      complement: '',
    }
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('AddressComplementStep Titles and Labels', () => {
  it('deve renderizar o título e rótulos personalizados para Matrícula', () => {
    render(
      <Wrapper>
        <AddressComplementStep onNext={() => {}} />
      </Wrapper>
    )

    expect(screen.getByText('Você tem o número da matrícula?')).toBeInTheDocument()
    expect(screen.getByText('Tenho o número da matrícula')).toBeInTheDocument()
    expect(screen.getByText('Não tenho o número da matrícula')).toBeInTheDocument()
  })

  it('deve renderizar o título e rótulos personalizados para Loteamento', () => {
    render(
      <Wrapper>
        <AddressComplementStep onNext={() => {}} />
      </Wrapper>
    )

    // Simula seleção de "Não tenho matrícula" para avançar para Loteamento
    fireEvent.click(screen.getByText('Não tenho o número da matrícula'))

    expect(screen.getByText('Você tem o nome do loteamento?')).toBeInTheDocument()
    expect(screen.getByText('Tenho o nome do loteamento')).toBeInTheDocument()
    expect(screen.getByText('Não tenho o nome do loteamento')).toBeInTheDocument()
  })

  it('deve renderizar o título e rótulos personalizados para Quadra', () => {
    render(
      <Wrapper>
        <AddressComplementStep onNext={() => {}} />
      </Wrapper>
    )

    fireEvent.click(screen.getByText('Não tenho o número da matrícula'))
    fireEvent.click(screen.getByText('Não tenho o nome do loteamento'))

    expect(screen.getByText('Você tem o número da quadra?')).toBeInTheDocument()
    expect(screen.getByText('Tenho o número da quadra')).toBeInTheDocument()
    expect(screen.getByText('Não tenho o número da quadra')).toBeInTheDocument()
  })

  it('deve renderizar o título e rótulos personalizados para Lote', () => {
    render(
      <Wrapper>
        <AddressComplementStep onNext={() => {}} />
      </Wrapper>
    )

    fireEvent.click(screen.getByText('Não tenho o número da matrícula'))
    fireEvent.click(screen.getByText('Não tenho o nome do loteamento'))
    fireEvent.click(screen.getByText('Não tenho o número da quadra'))

    expect(screen.getByText('Você tem o número do lote?')).toBeInTheDocument()
    expect(screen.getByText('Tenho o número do lote')).toBeInTheDocument()
    expect(screen.getByText('Não tenho o número do lote')).toBeInTheDocument()
  })

  it('deve renderizar o campo de complemento após o Lote', () => {
    render(
      <Wrapper>
        <AddressComplementStep onNext={() => {}} />
      </Wrapper>
    )

    fireEvent.click(screen.getByText('Não tenho o número da matrícula'))
    fireEvent.click(screen.getByText('Não tenho o nome do loteamento'))
    fireEvent.click(screen.getByText('Não tenho o número da quadra'))
    fireEvent.click(screen.getByText('Não tenho o número do lote'))

    expect(screen.getByText('Complemento do endereço')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Edifício Sol, Bloco B, Apto 301')).toBeInTheDocument()
  })
})
