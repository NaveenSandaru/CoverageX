import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"

import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Registration Process",
  description: "Multi-step registration form",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
       
          {children}
          <Toaster position="top-center" />
        
      </body>
    </html>
  )
}
