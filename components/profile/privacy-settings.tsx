"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Mail, Phone, MapPin, User } from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface PrivacySettingsProps {
  user: UserType
  onChange: (settings: UserType["privacy_settings"]) => void
}

export default function PrivacySettings({ user, onChange }: PrivacySettingsProps) {
  // Výchozí nastavení soukromí
  const defaultSettings = {
    show_email: false,
    show_phone: false,
    show_address: false,
    show_bio: true,
  }

  // Použijeme nastavení uživatele nebo výchozí hodnoty
  const [settings, setSettings] = useState(user.privacy_settings || defaultSettings)

  // Aktualizujeme lokální stav, když se změní user prop
  useEffect(() => {
    if (user.privacy_settings) {
      setSettings(user.privacy_settings)
    }
  }, [user.privacy_settings])

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    onChange(newSettings)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nastavení soukromí</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-gray-500 mb-4">
          Vyberte, které informace budou viditelné pro ostatní uživatele na vašem veřejném profilu.
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <Label htmlFor="show-email" className="font-medium">
                Zobrazit e-mail
              </Label>
            </div>
            <Switch id="show-email" checked={settings.show_email} onCheckedChange={() => handleToggle("show_email")} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <Label htmlFor="show-phone" className="font-medium">
                Zobrazit telefon
              </Label>
            </div>
            <Switch id="show-phone" checked={settings.show_phone} onCheckedChange={() => handleToggle("show_phone")} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Label htmlFor="show-address" className="font-medium">
                Zobrazit adresu
              </Label>
            </div>
            <Switch
              id="show-address"
              checked={settings.show_address}
              onCheckedChange={() => handleToggle("show_address")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <Label htmlFor="show-bio" className="font-medium">
                Zobrazit informace "O mně"
              </Label>
            </div>
            <Switch id="show-bio" checked={settings.show_bio} onCheckedChange={() => handleToggle("show_bio")} />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mt-6">
          <h4 className="font-medium text-blue-900 mb-2">Tipy pro nastavení soukromí:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Zobrazení kontaktních údajů usnadní komunikaci s ostatními uživateli</li>
            <li>• Adresa může pomoci při domlouvání předání předmětů</li>
            <li>• Informace "O mně" zvyšují důvěryhodnost vašeho profilu</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
