import { useCallback, useLayoutEffect, useRef } from 'react'

const BOTTOM_THRESHOLD_PX = 72

export function useChatScroll(conversationId: string | null, messageKey: string) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const shouldStickToBottomRef = useRef(true)
  const previousConversationRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !conversationId) return

    if (previousConversationRef.current !== conversationId) {
      previousConversationRef.current = conversationId
      shouldStickToBottomRef.current = true
    }

    if (shouldStickToBottomRef.current) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [conversationId, messageKey])

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD_PX
  }, [])

  const followNextMessage = useCallback(() => {
    shouldStickToBottomRef.current = true
  }, [])

  return { viewportRef, handleScroll, followNextMessage }
}
