import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import Header from "@/components/layout/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Komunitní výpůjčky mezi sousedy",
  description:
    "Moderní platforma pro půjčování věcí mezi sousedy. Půjčte si nářadí, sportovní vybavení a další předměty od lidí ve vaší komunitě.",
  keywords: "půjčování, komunita, sousedé, nářadí, sportovní vybavení, sdílená ekonomika, sharing economy",
  authors: [{ name: "SousedePůjč Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <Header />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
