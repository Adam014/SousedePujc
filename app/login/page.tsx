"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { Package, Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const { login, resendVerification } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNeedsVerification(false)
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push("/")
      } else if (result.needsVerification) {
        setNeedsVerification(true)
        setError(
          "Váš e-mail ještě nebyl ověřen. Zkontrolujte svou e-mailovou schránku a klikněte na odkaz pro ověření.",
        )
      } else {
        setError("Neplatné přihlašovací údaje")
      }
    } catch (error) {
      setError("Došlo k chybě při přihlašování")
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Zadejte prosím e-mailovou adresu")
      return
    }

    setResendingVerification(true)
    try {
      const success = await resendVerification(email)
      if (success) {
        setError("Ověřovací e-mail byl znovu odeslán. Zkontrolujte svou e-mailovou schránku.")
      } else {
        setError("Nepodařilo se znovu odeslat ověřovací e-mail")
      }
    } catch (error) {
      setError("Došlo k chybě při odesílání e-mailu")
    } finally {
      setResendingVerification(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Přihlášení</CardTitle>
          <CardDescription>Přihlaste se do svého účtu</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant={needsVerification ? "default" : "destructive"}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {needsVerification && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Ověření e-mailu</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Pro dokončení registrace musíte ověřit svou e-mailovou adresu.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="w-full"
                >
                  {resendingVerification ? "Odesílání..." : "Znovu odeslat ověřovací e-mail"}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vas@email.cz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {/* Demo účty */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">Demo účty (heslo: heslo123):</p>
              <div className="text-xs text-blue-700 space-y-1">
                <div>jan.novak@email.cz (uživatel)</div>
                <div>marie.svoboda@email.cz (uživatel)</div>
                <div>admin@community.cz (administrátor)</div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Přihlašování..." : "Přihlásit se"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Nemáte účet?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Registrujte se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
