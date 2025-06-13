"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContentWarningProps {
  show: boolean
  onClose: () => void
}

export default function ContentWarning({ show, onClose }: ContentWarningProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      // Automaticky skrýt po 5 sekundách
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!isVisible) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-3">
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">Vaše zpráva obsahovala nevhodný obsah a byla automaticky upravena.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
            className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
