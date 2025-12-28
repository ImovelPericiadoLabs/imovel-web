'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { VolumeX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/button'

export default function ConsultarImovelPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [hasStartedAudio, setHasStartedAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const unlocked = localStorage.getItem('vsl-unlocked') === 'true'
    if (unlocked) {
      setIsUnlocked(true)
    }
  }, [])

  useEffect(() => {
    router.prefetch('/consultar-imovel')

    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay aguardando interação ou bloqueado:", err)
      })
    }
  }, [router])

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    const currentTime = video.currentTime
    const duration = video.duration || 1

    const currentProgress = (currentTime / duration) * 100
    setProgress(currentProgress)

    const left = Math.ceil(duration - currentTime)
    setRemainingTime(Math.max(0, left))

    if (currentProgress > 98 && !isUnlocked) {
      setIsUnlocked(true)
      setRemainingTime(0)
      localStorage.setItem('vsl-unlocked', 'true')
    }
  }

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setRemainingTime(Math.ceil(e.currentTarget.duration))
  }

  const handleUnmuteAndRestart = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = false
    setIsMuted(false)
    
    video.currentTime = 0
    setHasStartedAudio(true)

    video.play().then(() => setIsPlaying(true)).catch(() => { })
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (!hasStartedAudio) {
      handleUnmuteAndRestart()
      return
    }

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }, [hasStartedAudio, handleUnmuteAndRestart])

  const handleStart = () => {
    if (isUnlocked) {
      localStorage.setItem('vsl-unlocked', 'true')
      router.push('/consultar-imovel')
    }
  }

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-black font-sans text-white flex justify-center items-center">
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsUnlocked(true)
            localStorage.setItem('vsl-unlocked', 'true')
          }}
          onClick={togglePlay}
        />

        {/* Camadas de Overlay */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full w-full justify-between px-6 pt-4 pb-4 pointer-events-none">
          {/* Logo */}
          <div className="flex flex-col items-center mt-2 opacity-40 scale-75 lg:scale-100">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={200}
              height={50}
              priority
            />
          </div>

          {/* Área Central: Botão Ativar Som */}
          <div className="flex-1 flex items-center justify-center relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleUnmuteAndRestart()
              }}
              type="button"
              className={`
                pointer-events-auto 
                flex items-center gap-3 px-8 py-3 rounded-full 
                bg-white/20 backdrop-blur-[3px] border border-white/10
                transition-all duration-500 ease-in-out
                hover:bg-white/30 cursor-pointer hover:scale-105
                ${!isMuted ? 'opacity-0 translate-y-4 pointer-events-none hidden' : 'opacity-100 translate-y-0 z-20'}
              `}
            >
              <span className="text-base font-semibold leading-none tracking-wide">Ativar som</span>
              <VolumeX className="size-6" />
            </button>

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
            <div className="flex flex-col gap-2">
              <div className="pointer-events-auto">
                <Button
                  onClick={handleStart}
                  disabled={!isUnlocked}
                  className={`
                    w-full h-10 rounded-full text-xs font-semibold transition-all duration-300
                    ${isUnlocked
                      ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-100'
                      : 'bg-[#8F8F8F] text-[#1A1A1A] cursor-not-allowed opacity-90'
                    }
                  `}
                >
                  {isUnlocked ? 'Começar' : `Começar (faltam ${remainingTime}s)`}
                </Button>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-1 bg-gray-600/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className={`h-full transition-all duration-200 ease-linear rounded-full ${isUnlocked ? 'bg-white' : 'bg-gray-300'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}