'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { ArrowDown, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/button'
import ConsultProperty from '@/sections/consult-property'
import type { ConsultPropertyHandle } from '@/sections/consult-property/consult-property'

export default function ConsultarImovelPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [remainingTime, setRemainingTime] = useState(0)
  const [isIntroAnimating, setIsIntroAnimating] = useState(true)
  const [requiresLock] = useState(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return params.has('lock')
  })
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    const hasLockParam = params.has('lock')
    if (!hasLockParam) return true
    return localStorage.getItem('vsl-unlocked') === 'true'
  })
  const [hasStartedAudio, setHasStartedAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isConsultActive, setIsConsultActive] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [ctaTheme] = useState<'default' | 'yellow'>(() => {
    if (typeof window === 'undefined') return 'default'
    const params = new URLSearchParams(window.location.search)
    return params.get('cta') === 'yellow' ? 'yellow' : 'default'
  })
  const consultRef = useRef<ConsultPropertyHandle>(null)
  const touchHandledRef = useRef(false)

  const attemptAutoplay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.play().catch((err) => {
      console.log("Autoplay aguardando interação ou bloqueado:", err)
    })
  }, [])

  useEffect(() => {
    router.prefetch('/consultar-imovel')
  }, [router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsIntroAnimating(false)
    }, 1600)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    attemptAutoplay()
  }, [attemptAutoplay])

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    const currentTime = video.currentTime
    const duration = video.duration || 1

    const currentProgress = (currentTime / duration) * 100
    const left = Math.ceil(duration - currentTime)
    setRemainingTime(Math.max(0, left))

    if (requiresLock && currentProgress > 98 && !isUnlocked) {
      setIsUnlocked(true)
      setRemainingTime(0)
      localStorage.setItem('vsl-unlocked', 'true')
    }
  }

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setIsVideoReady(true)
    attemptAutoplay()
    if (!requiresLock) {
      setRemainingTime(0)
      return
    }
    setRemainingTime(Math.ceil(e.currentTarget.duration))
  }

  const handleUnmute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = false
    setHasStartedAudio(true)

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true)
      }).catch(() => { })
      return
    }

    video.play().then(() => {
      setIsPlaying(true)
    }).catch(() => { })
  }, [])

  const handleActivateAudio = useCallback((event: React.SyntheticEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('[data-cta="start"]')) return
    if (!hasStartedAudio) {
      handleUnmute()
      return
    }
  }, [handleUnmute, hasStartedAudio])

  const handleStart = useCallback(() => {
    if (!isUnlocked) return
    localStorage.setItem('vsl-unlocked', 'true')

    flushSync(() => {
      setIsConsultActive(true)
    })

    const didFocus = consultRef.current?.focusAddress() ?? false
    if (didFocus) {
      window.history.pushState({}, '', '/consultar-imovel')
    }
  }, [isUnlocked])

  const handleTouchStart = useCallback(() => {
    if (touchHandledRef.current) return
    touchHandledRef.current = true
    handleStart()
  }, [handleStart])

  const handleClick = useCallback(() => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }
    handleStart()
  }, [handleStart])

  if (isConsultActive) {
    return <ConsultProperty ref={consultRef} />
  }

  return (
    <main
      className="relative w-full h-dvh overflow-hidden bg-black font-sans text-white flex justify-center items-center"
      onClick={handleActivateAudio}
      onTouchStart={handleActivateAudio}
    >
      <div className="relative w-full h-full lg:h-auto lg:max-w-[calc(100dvh*(16/9))] lg:aspect-video mx-auto flex flex-col items-center justify-center overflow-hidden shadow-2xl">
        {/* Atributos vitais para iPhone: 
            - autoPlay + muted + playsInline (obrigatórios para iniciar sem clique)
            - preload="auto" (ajuda a carregar o buffer mais rápido)
        */}
        <video
          ref={videoRef}
          src="/vsl.mp4"
          className="absolute inset-0 w-full h-full object-cover lg:object-contain cursor-pointer"
          playsInline
          autoPlay
          muted
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={() => {
            attemptAutoplay()
          }}
          onCanPlayThrough={() => {
            attemptAutoplay()
          }}
          onPlay={() => {
            setIsPlaying(true)
          }}
          onPause={() => setIsPlaying(false)}
          loop
          onEnded={() => {
            if (!requiresLock) return
            setIsUnlocked(true)
            localStorage.setItem('vsl-unlocked', 'true')
          }}
        />

        {/* Camadas de Overlay */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        {!isVideoReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 text-white pointer-events-none">
            <span className="text-sm font-medium tracking-wide">Carregando vídeo...</span>
          </div>
        )}

        <div className="relative z-10 flex flex-col h-full w-full justify-between px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none">
          {/* Logo */}
          <div className="flex flex-col items-center mt-2 opacity-40 scale-75 lg:scale-100">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={72}
              height={70}
              priority
              className="object-contain -my-2.5"
            />
          </div>

          <div className="flex flex-col items-center text-center gap-2 mt-1" />

          {/* Área Central */}
          <div className="flex-1 flex items-center justify-center relative">
            {!isPlaying && hasStartedAudio && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="size-20 rounded-full bg-white/20 backdrop-blur-[3px] flex items-center justify-center animate-in fade-in zoom-in duration-300">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-10 fill-white/80 pl-1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M5.25 5.054a2 2 0 0 1 3.097-1.67l11.405 7.128a2 2 0 0 1 0 3.376L8.347 21.016A2 2 0 0 1 5.25 19.346V5.054Z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé: Texto e Progresso */}
          <div className="flex flex-col gap-2 w-full max-w-md mx-auto mb-2">
            <div className="flex flex-col gap-4">
              <div
                className={`pointer-events-auto relative flex flex-col items-center gap-2 ${isIntroAnimating ? 'cta-drop' : ''}`}
                data-cta="start"
              >
                {isUnlocked && (
                  <>
                    <p
                      className="text-[12px] text-white/90 font-semibold tracking-wide uppercase"
                      style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85)' }}
                    >
                      Toque No Botao Abaixo
                    </p>
                    <ArrowDown
                      className="size-7 animate-bounce text-white"
                      aria-hidden="true"
                      style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))' }}
                    />
                  </>
                )}
                <Button
                  onClick={handleClick}
                  onTouchStart={handleTouchStart}
                  disabled={!isUnlocked}
                  icon={<Home className="size-5" />}
                  className={`
                    w-full h-12 rounded-xl text-lg font-extrabold tracking-wide transition-all duration-300
                    ${isUnlocked
                      ? (ctaTheme === 'yellow'
                        ? '!shadow-[0_6px_0_#b45309] active:!shadow-[0_2px_0_#b45309] bg-amber-500 text-black border border-amber-600/60 hover:bg-amber-400 active:translate-y-1'
                        : '!shadow-[0_6px_0_#1e3a8a] active:!shadow-[0_2px_0_#1e3a8a] bg-blue-500 text-white border border-blue-700/70 hover:bg-blue-400 active:translate-y-1'
                      )
                      : 'bg-[#8F8F8F] text-[#1A1A1A] cursor-not-allowed opacity-90'
                    }
                  `}
                >
                  <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]">
                    {isUnlocked ? 'Consultar Imóvel Agora' : `Consultar Imóvel Agora (faltam ${remainingTime}s)`}
                  </span>
                </Button>
              </div>

              {/* Barra de Progresso removida */}
              <p
                className="text-[11px] text-white/80 text-center uppercase tracking-[0.2em] font-medium"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
              >
                CNPJ 50.199.038/0001-03 • LGPD
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}