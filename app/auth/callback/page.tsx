"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setStatus("error")
          setMessage("Chyba při ověřování e-mailu")
          return
        }

        if (data.session) {
          setStatus("success")
          setMessage("E-mail byl úspěšně ověřen! Budete přesměrováni...")

          // Přesměrujeme na hlavní stránku po 2 sekundách
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          setStatus("error")
          setMessage("Nepodařilo se ověřit e-mail")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Došlo k neočekávané chybě")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ověřování e-mailu...</h2>
              <p className="text-gray-600">Prosím čekejte, ověřujeme váš e-mail.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Úspěch!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chyba</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
