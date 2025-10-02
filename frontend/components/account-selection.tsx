"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { User, Building, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AccountSelection() {
  const [isLoadingClient, setIsLoadingClient] = useState(false)
  const [isLoadingProvider, setIsLoadingProvider] = useState(false)
  const router = useRouter()

  const handleClientClick = () => {
    setIsLoadingClient(true)
    router.push("/auth/client-register")
  }

  const handleProviderClick = () => {
    setIsLoadingProvider(true)
    router.push("/auth/provider-register")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-emerald-600 mb-2">Registration Process</div>
          <p className="text-gray-600">Choose your account type to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={handleClientClick} 
            disabled={isLoadingClient || isLoadingProvider}
            className="w-full"
          >
            <Card className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-[#447565] h-full ${isLoadingClient ? 'opacity-75' : ''}`}>
              <CardContent className="p-8 text-center h-full flex flex-col">
                {isLoadingClient ? (
                  <Loader2 className="w-16 h-16 mx-auto mb-6 text-[#059669] animate-spin" />
                ) : (
                  <User className="w-16 h-16 mx-auto mb-6 text-[#059669]" />
                )}
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Client Account</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Looking for services? Create a client account to browse and book services from our providers.
                </p>
                <div className="bg-[#059669] text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center">
                  {isLoadingClient ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Register as Client"
                  )}
                </div>
              </CardContent>
            </Card>
          </button>

          <button 
            onClick={handleProviderClick}
            disabled={isLoadingClient || isLoadingProvider}
            className="w-full"
          >
            <Card className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-[#447565] h-full ${isLoadingProvider ? 'opacity-75' : ''}`}>
              <CardContent className="p-8 text-center h-full flex flex-col">
                {isLoadingProvider ? (
                  <Loader2 className="w-16 h-16 mx-auto mb-6 text-[#059669] animate-spin" />
                ) : (
                  <Building className="w-16 h-16 mx-auto mb-6 text-[#059669]" />
                )}
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Service Provider</h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Want to offer services? Create a provider account to showcase your services and manage bookings.
                </p>
                <div className="bg-[#059669] text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center">
                  {isLoadingProvider ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Register as Provider"
                  )}
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
