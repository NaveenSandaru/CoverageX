import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"

import { Toaster } from "sonner"
import { Navbar } from "@/components/navbar"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Simply Booked",
  description: "Multi-step registration form",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
          <Navbar/>
          {children}
          <Toaster position="top-center" />
          <Footer/>
        
      </body>
    </html>
  )
}
