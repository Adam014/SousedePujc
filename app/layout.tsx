import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/layout/header"
import { AuthProvider } from "@/lib/auth"
import ChatPopup from "@/components/chat/chat-popup"
import { ErrorBoundary } from "@/components/error/error-boundary"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin", "latin-ext"] })

export const metadata = {
  title: "SousedePůjč - Půjčování věcí mezi sousedy",
  description: "Platforma pro půjčování věcí mezi sousedy",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://pqygnezxuosrvhkabjki.supabase.co" />
        <link rel="dns-prefetch" href="https://pqygnezxuosrvhkabjki.supabase.co" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <Suspense fallback={<div className="flex-1 flex items-center justify-center">Načítání...</div>}>
                  <main className="flex-1">{children}</main>
                </Suspense>
                <ChatPopup />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
