"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

export default function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Pokud je heslo prázdné, resetujeme sílu
    if (!password) {
      setStrength(0)
      setMessage("")
      return
    }

    // Výpočet síly hesla
    let score = 0

    // Délka hesla
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Složitost hesla
    if (/[a-z]/.test(password)) score += 1 // Malá písmena
    if (/[A-Z]/.test(password)) score += 1 // Velká písmena
    if (/[0-9]/.test(password)) score += 1 // Čísla
    if (/[^a-zA-Z0-9]/.test(password)) score += 1 // Speciální znaky

    // Penalizace za opakující se znaky
    const repeats = password.match(/(.)\1{2,}/g)
    if (repeats) score = Math.max(0, score - repeats.length)

    // Normalizace skóre na stupnici 0-4
    const normalizedScore = Math.min(4, Math.max(0, score))
    setStrength(normalizedScore)

    // Nastavení zprávy podle síly hesla
    switch (normalizedScore) {
      case 0:
        setMessage("Velmi slabé")
        break
      case 1:
        setMessage("Slabé")
        break
      case 2:
        setMessage("Průměrné")
        break
      case 3:
        setMessage("Silné")
        break
      case 4:
        setMessage("Velmi silné")
        break
      default:
        setMessage("")
    }
  }, [password])

  // Barvy pro různé úrovně síly
  const getColor = () => {
    switch (strength) {
      case 0:
        return "bg-gray-200"
      case 1:
        return "bg-red-500"
      case 2:
        return "bg-orange-500"
      case 3:
        return "bg-yellow-500"
      case 4:
        return "bg-green-500"
      default:
        return "bg-gray-200"
    }
  }

  // Tipy pro zlepšení hesla
  const getTips = () => {
    if (!password) return null

    const tips = []

    if (password.length < 8) tips.push("Použijte alespoň 8 znaků")
    if (!/[a-z]/.test(password)) tips.push("Přidejte malá písmena")
    if (!/[A-Z]/.test(password)) tips.push("Přidejte velká písmena")
    if (!/[0-9]/.test(password)) tips.push("Přidejte číslice")
    if (!/[^a-zA-Z0-9]/.test(password)) tips.push("Přidejte speciální znaky (např. !@#$%)")
    if (/(.)\1{2,}/.test(password)) tips.push("Vyhněte se opakujícím se znakům")

    if (tips.length === 0) return null

    return (
      <ul className="text-xs text-gray-500 mt-1 space-y-0.5 list-disc list-inside">
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    )
  }

  if (!password) return null

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", getColor())}
            style={{ width: `${(strength / 4) * 100}%` }}
          />
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            strength <= 1
              ? "text-red-500"
              : strength === 2
                ? "text-orange-500"
                : strength === 3
                  ? "text-yellow-600"
                  : "text-green-600",
          )}
        >
          {message}
        </span>
      </div>
      {getTips()}
    </div>
  )
}
