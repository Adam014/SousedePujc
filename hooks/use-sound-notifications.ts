"use client"

import { useEffect, useRef, useState } from "react"

export function useSoundNotifications() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Inicializace audio contextu po user interaction
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        setIsEnabled(true)
        document.removeEventListener("click", initAudio)
        document.removeEventListener("keydown", initAudio)
      } catch (error) {
        console.log("Audio context not supported:", error)
      }
    }

    document.addEventListener("click", initAudio)
    document.addEventListener("keydown", initAudio)

    return () => {
      document.removeEventListener("click", initAudio)
      document.removeEventListener("keydown", initAudio)
    }
  }, [])

  const playMessageSound = async () => {
    if (!audioContextRef.current || !isEnabled) return

    try {
      const audioContext = audioContextRef.current

      // Obnovíme context pokud je suspended
      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Nastavení zvuku - příjemný notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log("Could not play message sound:", error)
    }
  }

  const playNotificationSound = () => {
    // Fallback pro starší prohlížeče
    if ("Notification" in window && Notification.permission === "granted") {
      // Můžeme přidat browser notification
    }
    playMessageSound()
  }

  return {
    playNotificationSound,
    playMessageSound,
    isEnabled,
  }
}
