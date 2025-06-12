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
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth"
import { Package, Mail, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validace
    if (formData.password !== formData.confirmPassword) {
      setError("Hesla se neshodují")
      return
    }

    if (formData.password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků")
      return
    }

    if (!formData.agreeToTerms) {
      setError("Musíte souhlasit s podmínkami použití")
      return
    }

    setLoading(true)

    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      if (success) {
        setSuccess(true)
        // Po 3 sekundách přesměrujeme na přihlášení
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError("Uživatel s tímto e-mailem již existuje")
      }
    } catch (error) {
      setError("Došlo k chybě při registraci")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registrace úspěšná!</h2>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Ověřte svůj e-mail</span>
              </div>
              <p className="text-sm text-green-700">
                Na adresu <strong>{formData.email}</strong> jsme odeslali ověřovací e-mail. Klikněte na odkaz v e-mailu
                pro dokončení registrace.
              </p>
            </div>
            <p className="text-sm text-gray-600">Budete automaticky přesměrováni na přihlašovací stránku...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Registrace</CardTitle>
          <CardDescription>Vytvořte si nový účet</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Jméno a příjmení</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                placeholder="Jan Novák"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                placeholder="vas@email.cz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                Souhlasím s{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  podmínkami použití
                </Link>{" "}
                a{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  zásadami ochrany osobních údajů
                </Link>
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrování..." : "Registrovat se"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Již máte účet?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Přihlaste se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
