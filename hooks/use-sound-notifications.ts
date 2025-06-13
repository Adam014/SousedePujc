"use client"

import { useEffect, useRef } from "react"

export function useSoundNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Vytvoření audio elementu pro notifikace
    audioRef.current = new Audio("/notification-sound.mp3")
    audioRef.current.volume = 0.5
  }, [])

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => {
        console.log("Could not play notification sound:", error)
      })
    }
  }

  const playMessageSound = () => {
    // Jednoduchý beep zvuk pomocí Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log("Could not play message sound:", error)
    }
  }

  return { playNotificationSound, playMessageSound }
}
