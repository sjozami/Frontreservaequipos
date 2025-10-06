import type React from "react"
import type { Metadata } from "next"
import { Geist, Manrope } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "Sistema de Reservas Educativo",
  description: "Sistema profesional de gestión de reservas para instituciones educativas",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <head>
        <title>Sistema de Reservas Educativo</title>
        <meta name="description" content="Sistema profesional de gestión de reservas para instituciones educativas" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
