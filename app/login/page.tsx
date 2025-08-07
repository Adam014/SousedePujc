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
import { Package, Mail, Eye, EyeOff, Lock, User } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, resendVerification } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNeedsVerification(false)
    setLoading(true)

    try {
      const result = await login(email, password, rememberMe)
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Přihlášení</CardTitle>
          <CardDescription className="text-gray-500">Přihlaste se do svého účtu pro pokračování</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant={needsVerification ? "default" : "destructive"} className="text-sm">
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
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vas@email.cz"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">
                  Heslo
                </Label>
                {/* <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Zapomenuté heslo?
                </Link> */}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">
                Zapamatovat přihlášení
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full py-5 text-base font-medium" disabled={loading}>
              {loading ? "Přihlašování..." : "Přihlásit se"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Nemáte účet?{" "}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Registrujte se
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
