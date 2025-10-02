import ProviderRegistration from "@/components/provider-registration"
import { Toaster } from "sonner"

export default function ProviderRegistrationPage() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <ProviderRegistration />
    </>
  )
}
