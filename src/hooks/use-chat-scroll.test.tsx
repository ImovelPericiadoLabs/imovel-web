import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useChatScroll } from './use-chat-scroll'

function ChatViewport({ conversationId, messageKey }: { conversationId: string; messageKey: string }) {
  const { viewportRef, handleScroll } = useChatScroll(conversationId, messageKey)
  return <div ref={viewportRef} onScroll={handleScroll} data-testid="viewport" />
}

function setDimensions(element: HTMLElement, scrollHeight: number, clientHeight = 300) {
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight })
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: clientHeight })
}

describe('useChatScroll', () => {
  it('acompanha mensagens novas somente quando o usuário está perto do fim', () => {
    const view = render(<ChatViewport conversationId="one" messageKey="1:first" />)
    const viewport = view.getByTestId('viewport')
    setDimensions(viewport, 1000)

    view.rerender(<ChatViewport conversationId="one" messageKey="2:second" />)
    expect(viewport.scrollTop).toBe(1000)

    viewport.scrollTop = 100
    fireEvent.scroll(viewport)
    setDimensions(viewport, 1200)
    view.rerender(<ChatViewport conversationId="one" messageKey="3:third" />)

    expect(viewport.scrollTop).toBe(100)
  })

  it('desce ao fim ao trocar de conversa', () => {
    const view = render(<ChatViewport conversationId="one" messageKey="1:first" />)
    const viewport = view.getByTestId('viewport')
    setDimensions(viewport, 900)
    viewport.scrollTop = 50
    fireEvent.scroll(viewport)

    setDimensions(viewport, 1400)
    view.rerender(<ChatViewport conversationId="two" messageKey="4:last" />)

    expect(viewport.scrollTop).toBe(1400)
  })
})
