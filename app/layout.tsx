import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/layout/header"
import { AuthProvider } from "@/lib/auth"
import ChatPopup from "@/components/chat/chat-popup"
import AnimatedBackground from "@/components/layout/animated-background"

const inter = Inter({ subsets: ["latin", "latin-ext"] })

export const metadata = {
  title: "SousedePůjč - Půjčování věcí mezi sousedy",
  description: "Platforma pro půjčování věcí mezi sousedy",
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <AnimatedBackground />
              <Header />
              <main className="flex-1">{children}</main>
              <ChatPopup />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
