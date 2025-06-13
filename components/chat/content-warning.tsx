"use client"

import { useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContentWarningProps {
  show: boolean
  onClose: () => void
}

export default function ContentWarning({ show, onClose }: ContentWarningProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto close after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 pr-8">
          Vaše zpráva obsahovala nevhodný obsah, který byl automaticky filtrován.
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  )
}
