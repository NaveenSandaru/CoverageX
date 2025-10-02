import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"

import ServiceproviderHeader from "@/components/serviceproviderheader"

import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Appointment Booking System",
  description: "Multi-step registration form",
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
          <ServiceproviderHeader/>
          {children}
          <Toaster position="top-center" />
          
        
      </body>
    </html>
  )
}
