"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Upload, User, Building, Shield, CheckCircle, Mail, AlertCircle, Info } from "lucide-react"
import Link from "next/link"

type AccountType = "client" | "provider" | null
type Step = 1 | 2 | 3 | 4

interface FormData {
  accountType: AccountType
  // Personal Info
  image: File | null
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  gender: string
  address: string
  preferredLanguages: string
  password: string
  confirmPassword: string
  // Company Info (for providers)
  companyName: string
  companyAddress: string
  companyNumber: string
  serviceType: string
  serviceSpecialty: string
  appointmentFee: string
  workHoursFrom: string
  workHoursTo: string
  weekDaysFrom: string
  weekDaysTo: string
  // Security
  securityQuestion1: string
  securityAnswer1: string
  securityQuestion2: string
  securityAnswer2: string
  securityQuestion3: string
  securityAnswer3: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  companyName?: string
  securityAnswer1?: string
  securityAnswer2?: string
  securityAnswer3?: string
}

const securityQuestions = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite movie?",
  "What city were you born in?",
  "What is your favorite food?",
  "What was your childhood nickname?",
  "What is the name of your best friend?",
]

export default function RegistrationProcess() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState<FormData>({
    accountType: null,
    image: null,
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    gender: "",
    address: "",
    preferredLanguages: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyAddress: "",
    companyNumber: "",
    serviceType: "",
    serviceSpecialty: "",
    appointmentFee: "",
    workHoursFrom: "",
    workHoursTo: "",
    weekDaysFrom: "",
    weekDaysTo: "",
    securityQuestion1: "",
    securityAnswer1: "",
    securityQuestion2: "",
    securityAnswer2: "",
    securityQuestion3: "",
    securityAnswer3: "",
  })

  
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [otpTimer, setOtpTimer] = useState(0)
  const [canResendOtp, setCanResendOtp] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const router = useRouter()

  const steps = [
    { number: 1, title: "Account Type", icon: User },
    { number: 2, title: "Personal Info", icon: User },
    { number: 3, title: "Verification", icon: Shield },
    { number: 4, title: "Security", icon: CheckCircle },
  ]

  // OTP Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1)
      }, 1000)
    } else if (otpTimer === 0 && otpSent) {
      setCanResendOtp(true)
    }
    return () => clearInterval(interval)
  }, [otpTimer, otpSent])

  // Cleanup image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (!password) return null

    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const strength = (hasLowerCase ? 1 : 0) + (hasUpperCase ? 1 : 0) + (hasNumbers ? 1 : 0) + (hasSpecialChars ? 1 : 0)

    if (password.length < 8) return "weak"
    if (strength <= 2) return "weak"
    if (strength === 3) return "medium"
    return "strong"
  }

  // Validate form fields
  const validateField = (name: string, value: string) => {
    const fieldErrors: FormErrors = {}

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          fieldErrors.firstName = "First name is required"
        }
        break
      case "lastName":
        if (!value.trim()) {
          fieldErrors.lastName = "Last name is required"
        }
        break
      case "email":
        if (!value.trim()) {
          fieldErrors.email = "Email is required"
        } else if (!isValidEmail(value)) {
          fieldErrors.email = "Please enter a valid email address"
        }
        break
      case "password":
        if (!value) {
          fieldErrors.password = "Password is required"
        } else if (value.length < 8) {
          fieldErrors.password = "Password must be at least 8 characters long"
        }

        // Update password strength
        setPasswordStrength(checkPasswordStrength(value))

        // Check if confirm password matches
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          fieldErrors.confirmPassword = "Passwords do not match"
        } else {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
        }
        break
      case "confirmPassword":
        if (!value) {
          fieldErrors.confirmPassword = "Please confirm your password"
        } else if (value !== formData.password) {
          fieldErrors.confirmPassword = "Passwords do not match"
        } else {
          // Clear any existing error when passwords match
          fieldErrors.confirmPassword = undefined
        }
        break
      case "companyName":
        if (formData.accountType === "provider" && !value.trim()) {
          fieldErrors.companyName = "Company name is required for service providers"
        }
        break
      case "securityAnswer1":
        if (!value.trim()) {
          fieldErrors.securityAnswer1 = "Please provide an answer"
        }
        break
      case "securityAnswer2":
        if (!value.trim()) {
          fieldErrors.securityAnswer2 = "Please provide an answer"
        }
        break
      case "securityAnswer3":
        if (!value.trim()) {
          fieldErrors.securityAnswer3 = "Please provide an answer"
        }
        break
    }

    return fieldErrors
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }))
    }

    // Validate field
    const fieldErrors = validateField(name, value)
    setErrors((prev) => ({ ...prev, ...fieldErrors }))
  }

  const handleFieldBlur = (name: string) => {
    // Mark field as touched on blur
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Validate field
    const fieldErrors = validateField(name, formData[name as keyof FormData] as string)
    setErrors((prev) => ({ ...prev, ...fieldErrors }))
  }

  const validateStep = () => {
    const stepErrors: FormErrors = {}
    let isValid = true

    switch (currentStep) {
      case 1:
        if (!formData.accountType) {
          toast.error("Please select an account type")
          isValid = false
        }
        break
      case 2:
        // Validate required personal info fields
        if (!formData.firstName.trim()) {
          stepErrors.firstName = "First name is required"
          isValid = false
        }
        if (!formData.lastName.trim()) {
          stepErrors.lastName = "Last name is required"
          isValid = false
        }
        if (!formData.email.trim()) {
          stepErrors.email = "Email is required"
          isValid = false
        } else if (!isValidEmail(formData.email)) {
          stepErrors.email = "Please enter a valid email address"
          isValid = false
        }
        if (!formData.password) {
          stepErrors.password = "Password is required"
          isValid = false
        } else if (formData.password.length < 8) {
          stepErrors.password = "Password must be at least 8 characters long"
          isValid = false
        }
        if (!formData.confirmPassword) {
          stepErrors.confirmPassword = "Please confirm your password"
          isValid = false
        } else if (formData.password !== formData.confirmPassword) {
          stepErrors.confirmPassword = "Passwords do not match"
          isValid = false
        }

        // Provider-specific validations
        if (formData.accountType === "provider" && !formData.companyName.trim()) {
          stepErrors.companyName = "Company name is required for service providers"
          isValid = false
        }
        break
      case 3:
        // Verification step validation handled by component state
        if (!isRecaptchaVerified) {
          toast.error("Please complete the reCAPTCHA verification")
          isValid = false
        }
        if (!isEmailVerified) {
          toast.error("Please verify your email address")
          isValid = false
        }
        break
      case 4:
        // Security questions validation
        if (!formData.securityQuestion1 || !formData.securityAnswer1.trim()) {
          stepErrors.securityAnswer1 = "Please select a question and provide an answer"
          isValid = false
        }
        if (!formData.securityQuestion2 || !formData.securityAnswer2.trim()) {
          stepErrors.securityAnswer2 = "Please select a question and provide an answer"
          isValid = false
        }
        if (!formData.securityQuestion3 || !formData.securityAnswer3.trim()) {
          stepErrors.securityAnswer3 = "Please select a question and provide an answer"
          isValid = false
        }
        break
    }

    setErrors((prev) => ({ ...prev, ...stepErrors }))
    return isValid
  }

  const handleNext = () => {
    if (validateStep() && currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step)
      // Reset touched state for next step fields
      setTouched({})
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
      // Reset touched state for previous step fields
      setTouched({})
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please select an image smaller than 5MB",
        })
        return
      }

      // Cleanup previous preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }

      const newPreview = URL.createObjectURL(file)
      setImagePreview(newPreview)
      setFormData({ ...formData, image: file })
    }
  }

  const handleRecaptcha = () => {
    setIsRecaptchaVerified(true)
    toast.success("reCAPTCHA Verified", {
      description: "You can now proceed to email verification.",
    })
  }

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const sendOtpToEmail = () => {
    if (!formData.email) {
      toast.error("Email Required", {
        description: "Please enter your email address first.",
      })
      return
    }

    if (!isValidEmail(formData.email)) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address.",
      })
      return
    }

    const newOtp = generateOtp()
    setGeneratedOtp(newOtp)
    setOtpSent(true)
    setCanResendOtp(false)
    setOtpTimer(60) // 60 seconds timer

    toast.success("OTP Sent", {
      description: `A 6-digit verification code has been sent to ${formData.email}`,
    })

    // For demo purposes, show the OTP in console (remove in production)
    console.log("Demo OTP:", newOtp)

    // Focus on first OTP input
    setTimeout(() => {
      otpRefs.current[0]?.focus()
    }, 100)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent more than 1 character
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const verifyOtp = () => {
    const enteredOtp = otp.join("")

    if (enteredOtp === generatedOtp) {
      setIsEmailVerified(true)
      toast.success("Email Verified", {
        description: "Your email has been successfully verified!",
      })
    } else {
      toast.error("Invalid OTP", {
        description: "The verification code you entered is incorrect. Please try again.",
      })
      // Clear OTP inputs
      setOtp(["", "", "", "", "", ""])
      otpRefs.current[0]?.focus()
    }
  }

  const resendOtp = () => {
    if (canResendOtp) {
      sendOtpToEmail()
      // Clear previous OTP
      setOtp(["", "", "", "", "", ""])
    }
  }

  const handleRegistrationComplete = () => {
    if (!validateStep()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Registration Successful!", {
        description: "Your account has been created successfully. Redirecting to login...",
      })

      // Simulate redirect to login page
      setTimeout(() => {
        // In a real app, you would use router.push('/login')
        console.log("Redirecting to login page...")
        router.push("/auth/login")
        setIsSubmitting(false)
      }, 2000)
    }, 1500)
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.number
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-gray-300 text-gray-400"
            }`}
          >
            {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
          </div>
          <span
            className={`ml-2 text-sm ${currentStep >= step.number ? "text-emerald-600 font-medium" : "text-gray-400"}`}
          >
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-4 ${currentStep > step.number ? "bg-emerald-600" : "bg-gray-300"}`} />
          )}
        </div>
      ))}
    </div>
  )

  // Error message component
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null
    return (
      <div className="flex items-center mt-1 text-red-500 text-sm">
        <AlertCircle className="w-3 h-3 mr-1" />
        <span>{message}</span>
      </div>
    )
  }

  const renderAccountTypeSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Choose Account Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            formData.accountType === "client" ? "ring-2 ring-emerald-600 bg-green-50" : ""
          }`}
          onClick={() => setFormData({ ...formData, accountType: "client" })}
        >
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Client Account</h3>
            <p className="text-sm text-gray-600">
              Looking for services? Create a client account to browse and book services from our providers.
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            formData.accountType === "provider" ? "ring-2 ring-emerald-600 bg-green-50" : ""
          }`}
          onClick={() => setFormData({ ...formData, accountType: "provider" })}
        >
          <CardContent className="p-6 text-center">
            <Building className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">Service Provider</h3>
            <p className="text-sm text-gray-600">
              Want to offer services? Create a provider account to showcase your services and manage bookings.
            </p>
          </CardContent>
        </Card>
      </div>

      {!formData.accountType && touched.accountType && (
        <div className="text-center mt-2">
          <div className="flex items-center justify-center text-amber-600 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>Please select an account type to continue</span>
          </div>
        </div>
      )}
    </div>
  )

  const renderPasswordStrengthIndicator = () => {
    if (!formData.password || !passwordStrength) return null

    const getStrengthColor = () => {
      switch (passwordStrength) {
        case "weak":
          return "bg-red-500"
        case "medium":
          return "bg-yellow-500"
        case "strong":
          return "bg-green-500"
        default:
          return "bg-gray-300"
      }
    }

    const getStrengthWidth = () => {
      switch (passwordStrength) {
        case "weak":
          return "w-1/3"
        case "medium":
          return "w-2/3"
        case "strong":
          return "w-full"
        default:
          return "w-0"
      }
    }

    const getStrengthText = () => {
      switch (passwordStrength) {
        case "weak":
          return "Weak password"
        case "medium":
          return "Medium strength"
        case "strong":
          return "Strong password"
        default:
          return ""
      }
    }

    return (
      <div className="mt-1">
        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`}></div>
        </div>
        <div className="flex items-center mt-1 text-xs">
          <span
            className={`
            ${passwordStrength === "weak" ? "text-red-500" : ""}
            ${passwordStrength === "medium" ? "text-yellow-500" : ""}
            ${passwordStrength === "strong" ? "text-green-500" : ""}
          `}
          >
            {getStrengthText()}
          </span>
          {passwordStrength !== "strong" && (
            <span className="ml-auto text-gray-500 text-xs">
              Use uppercase, lowercase, numbers, and special characters
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderPasswordMatchIndicator = () => {
    // Only show indicator when both password fields have content and no error message is being shown
    if (!formData.password || !formData.confirmPassword || (errors.confirmPassword && touched.confirmPassword)) {
      return null
    }

    const passwordsMatch = formData.password === formData.confirmPassword

    if (passwordsMatch) {
      return (
        <div className="mt-1">
          <div className="flex items-center text-xs text-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Passwords match</span>
          </div>
        </div>
      )
    }

    return null
  }

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Personal Information</h2>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Profile Image</Label>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <Input type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
        </div>
        <p className="text-xs text-gray-500">Maximum file size: 5MB. Recommended dimensions: 200x200px.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="firstName" className="flex items-center">
            First Name <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            onBlur={() => handleFieldBlur("firstName")}
            placeholder="Enter your first name"
            className={errors.firstName && touched.firstName ? "border-red-500" : ""}
            aria-invalid={errors.firstName && touched.firstName ? "true" : "false"}
            aria-describedby={errors.firstName && touched.firstName ? "firstName-error" : undefined}
            required
          />
          <ErrorMessage message={touched.firstName ? errors.firstName : undefined} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName" className="flex items-center">
            Last Name <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            onBlur={() => handleFieldBlur("lastName")}
            placeholder="Enter your last name"
            className={errors.lastName && touched.lastName ? "border-red-500" : ""}
            aria-invalid={errors.lastName && touched.lastName ? "true" : "false"}
            aria-describedby={errors.lastName && touched.lastName ? "lastName-error" : undefined}
            required
          />
          <ErrorMessage message={touched.lastName ? errors.lastName : undefined} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email" className="flex items-center">
          Email <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          onBlur={() => handleFieldBlur("email")}
          placeholder="Enter your email"
          className={errors.email && touched.email ? "border-red-500" : ""}
          aria-invalid={errors.email && touched.email ? "true" : "false"}
          aria-describedby={errors.email && touched.email ? "email-error" : undefined}
          required
        />
        <ErrorMessage message={touched.email ? errors.email : undefined} />
      </div>

      {formData.accountType === "client" && (
        <>
          <div className="space-y-1">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="Enter your contact number"
            />
          </div>

          <div className="space-y-1">
            <Label>Gender</Label>
            <RadioGroup value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter your address"
            />
          </div>
        </>
      )}

      {formData.accountType === "provider" && (
        <div className="space-y-1">
          <Label htmlFor="preferredLanguages">Preferred Languages</Label>
          <Input
            id="preferredLanguages"
            value={formData.preferredLanguages}
            onChange={(e) => setFormData({ ...formData, preferredLanguages: e.target.value })}
            placeholder="e.g., English, Spanish, French"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="password" className="flex items-center">
            Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            onBlur={() => handleFieldBlur("password")}
            placeholder="Enter your password (min 8 characters)"
            className={errors.password && touched.password ? "border-red-500" : ""}
            aria-invalid={errors.password && touched.password ? "true" : "false"}
            aria-describedby={errors.password && touched.password ? "password-error" : undefined}
            required
          />
          <ErrorMessage message={touched.password ? errors.password : undefined} />
          {renderPasswordStrengthIndicator()}
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="flex items-center">
            Confirm Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
            onBlur={() => handleFieldBlur("confirmPassword")}
            placeholder="Confirm your password"
            className={errors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""}
            aria-invalid={errors.confirmPassword && touched.confirmPassword ? "true" : "false"}
            aria-describedby={errors.confirmPassword && touched.confirmPassword ? "confirmPassword-error" : undefined}
            required
          />
          <ErrorMessage message={touched.confirmPassword ? errors.confirmPassword : undefined} />
          {renderPasswordMatchIndicator()}
        </div>
      </div>

      {/* Company Information for Service Providers */}
      {formData.accountType === "provider" && (
        <div className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>

          <div className="space-y-1">
            <Label htmlFor="companyName" className="flex items-center">
              Company Name <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleFieldChange("companyName", e.target.value)}
              onBlur={() => handleFieldBlur("companyName")}
              placeholder="Enter company name"
              className={errors.companyName && touched.companyName ? "border-red-500" : ""}
              aria-invalid={errors.companyName && touched.companyName ? "true" : "false"}
              aria-describedby={errors.companyName && touched.companyName ? "companyName-error" : undefined}
              required
            />
            <ErrorMessage message={touched.companyName ? errors.companyName : undefined} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="companyAddress">Company Address</Label>
            <Textarea
              id="companyAddress"
              value={formData.companyAddress}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              placeholder="Enter company address"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="companyNumber">Company Number</Label>
            <Input
              id="companyNumber"
              value={formData.companyNumber}
              onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
              placeholder="Enter company number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="serviceSpecialty">Service Specialty</Label>
              <Input
                id="serviceSpecialty"
                value={formData.serviceSpecialty}
                onChange={(e) => setFormData({ ...formData, serviceSpecialty: e.target.value })}
                placeholder="e.g., Cardiology, Hair Styling"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="appointmentFee">Appointment Fee ($)</Label>
            <Input
              id="appointmentFee"
              type="number"
              min="0"
              step="0.01"
              value={formData.appointmentFee}
              onChange={(e) => setFormData({ ...formData, appointmentFee: e.target.value })}
              placeholder="Enter appointment fee"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Work Hours</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="time"
                  value={formData.workHoursFrom}
                  onChange={(e) => setFormData({ ...formData, workHoursFrom: e.target.value })}
                />
                <span>to</span>
                <Input
                  type="time"
                  value={formData.workHoursTo}
                  onChange={(e) => setFormData({ ...formData, workHoursTo: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Work Days</Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={formData.weekDaysFrom}
                  onValueChange={(value) => setFormData({ ...formData, weekDaysFrom: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
                <span>to</span>
                <Select
                  value={formData.weekDaysTo}
                  onValueChange={(value) => setFormData({ ...formData, weekDaysTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderVerification = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Verification</h2>

      {/* reCAPTCHA */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Human Verification</h3>
        <div
          className={`border rounded-lg p-4 ${!isRecaptchaVerified ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"}`}
        >
          <div className="flex items-center space-x-3">
            <Checkbox
              id="recaptcha"
              checked={isRecaptchaVerified}
              onCheckedChange={handleRecaptcha}
              className={isRecaptchaVerified ? "bg-green-500 text-white" : ""}
            />
            <Label htmlFor="recaptcha" className="text-sm">
              {"I'm not a robot"}
            </Label>
            <div className="ml-auto">
              <img src="/placeholder.svg?height=40&width=40" alt="reCAPTCHA" className="w-10 h-10" />
            </div>
          </div>
          {!isRecaptchaVerified && (
            <div className="flex items-center mt-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>Please verify that you are not a robot</span>
            </div>
          )}
        </div>
      </div>

      {/* Email Verification with OTP */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Verification</h3>
        <div
          className={`space-y-4 border rounded-lg p-4 ${isEmailVerified ? "border-emerald-300 bg-emerald-50" : !otpSent ? "border-amber-300 bg-amber-50" : "border-blue-300 bg-blue-50"}`}
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>
              {"We'll send a 6-digit verification code to: "}
              <strong>{formData.email}</strong>
            </span>
          </div>

          {!otpSent ? (
            <>
              <Button onClick={sendOtpToEmail} disabled={!isRecaptchaVerified || !formData.email} className="w-full">
                Send Verification Code
              </Button>
              {!isRecaptchaVerified && (
                <div className="flex items-center text-amber-600 text-sm">
                  <Info className="w-4 h-4 mr-1" />
                  <span>Complete the reCAPTCHA verification first</span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-4">Enter the 6-digit verification code sent to your email</p>

                {/* OTP Input Fields */}
                <div className="flex justify-center space-x-2 mb-4">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-12 text-center text-lg font-semibold ${isEmailVerified ? "border-emerald-500 bg-emerald-50" : ""}`}
                      disabled={isEmailVerified}
                    />
                  ))}
                </div>

                {/* Timer and Resend */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">{otpTimer > 0 && `Resend available in ${otpTimer}s`}</div>
                  <Button
                    variant="link"
                    onClick={resendOtp}
                    disabled={!canResendOtp}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    Resend Code
                  </Button>
                </div>

                {/* Verify Button */}
                {!isEmailVerified ? (
                  <Button onClick={verifyOtp} disabled={otp.some((digit) => !digit)} className="w-full">
                    Verify Code
                  </Button>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Email verified successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Security Questions</h2>
      <p className="text-center text-gray-600">Please select and answer 3 security questions for account recovery.</p>

      <div className="space-y-6">
        {/* Security Question 1 */}
        <div className="space-y-1">
          <Label className="flex items-center">
            Security Question 1 <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.securityQuestion1}
            onValueChange={(value) => setFormData({ ...formData, securityQuestion1: value })}
          >
            <SelectTrigger
              className={
                errors.securityAnswer1 && touched.securityAnswer1 && !formData.securityQuestion1 ? "border-red-500" : ""
              }
            >
              <SelectValue placeholder="Select a security question" />
            </SelectTrigger>
            <SelectContent>
              {securityQuestions.map((question, index) => (
                <SelectItem key={index} value={question}>
                  {question}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Your answer"
            value={formData.securityAnswer1}
            onChange={(e) => handleFieldChange("securityAnswer1", e.target.value)}
            onBlur={() => handleFieldBlur("securityAnswer1")}
            className={errors.securityAnswer1 && touched.securityAnswer1 ? "border-red-500" : ""}
            aria-invalid={errors.securityAnswer1 && touched.securityAnswer1 ? "true" : "false"}
            required
          />
          <ErrorMessage message={touched.securityAnswer1 ? errors.securityAnswer1 : undefined} />
        </div>

        {/* Security Question 2 */}
        <div className="space-y-1">
          <Label className="flex items-center">
            Security Question 2 <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.securityQuestion2}
            onValueChange={(value) => setFormData({ ...formData, securityQuestion2: value })}
          >
            <SelectTrigger
              className={
                errors.securityAnswer2 && touched.securityAnswer2 && !formData.securityQuestion2 ? "border-red-500" : ""
              }
            >
              <SelectValue placeholder="Select a security question" />
            </SelectTrigger>
            <SelectContent>
              {securityQuestions
                .filter((q) => q !== formData.securityQuestion1)
                .map((question, index) => (
                  <SelectItem key={index} value={question}>
                    {question}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Your answer"
            value={formData.securityAnswer2}
            onChange={(e) => handleFieldChange("securityAnswer2", e.target.value)}
            onBlur={() => handleFieldBlur("securityAnswer2")}
            className={errors.securityAnswer2 && touched.securityAnswer2 ? "border-red-500" : ""}
            aria-invalid={errors.securityAnswer2 && touched.securityAnswer2 ? "true" : "false"}
            required
          />
          <ErrorMessage message={touched.securityAnswer2 ? errors.securityAnswer2 : undefined} />
        </div>

        {/* Security Question 3 */}
        <div className="space-y-1">
          <Label className="flex items-center">
            Security Question 3 <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.securityQuestion3}
            onValueChange={(value) => setFormData({ ...formData, securityQuestion3: value })}
          >
            <SelectTrigger
              className={
                errors.securityAnswer3 && touched.securityAnswer3 && !formData.securityQuestion3 ? "border-red-500" : ""
              }
            >
              <SelectValue placeholder="Select a security question" />
            </SelectTrigger>
            <SelectContent>
              {securityQuestions
                .filter((q) => q !== formData.securityQuestion1 && q !== formData.securityQuestion2)
                .map((question, index) => (
                  <SelectItem key={index} value={question}>
                    {question}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Your answer"
            value={formData.securityAnswer3}
            onChange={(e) => handleFieldChange("securityAnswer3", e.target.value)}
            onBlur={() => handleFieldBlur("securityAnswer3")}
            className={errors.securityAnswer3 && touched.securityAnswer3 ? "border-red-500" : ""}
            aria-invalid={errors.securityAnswer3 && touched.securityAnswer3 ? "true" : "false"}
            required
          />
          <ErrorMessage message={touched.securityAnswer3 ? errors.securityAnswer3 : undefined} />
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderAccountTypeSelection()
      case 2:
        return renderPersonalInfo()
      case 3:
        return renderVerification()
      case 4:
        return renderSecurity()
      default:
        return renderAccountTypeSelection()
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.accountType !== null
      case 2:
        return (
          formData.firstName.trim() &&
          formData.lastName.trim() &&
          formData.email.trim() &&
          isValidEmail(formData.email) &&
          formData.password.trim() &&
          formData.confirmPassword.trim() &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 8 &&
          (formData.accountType !== "provider" || formData.companyName.trim())
        )
      case 3:
        return isRecaptchaVerified && isEmailVerified
      case 4:
        return (
          formData.securityQuestion1 &&
          formData.securityAnswer1.trim() &&
          formData.securityQuestion2 &&
          formData.securityAnswer2.trim() &&
          formData.securityQuestion3 &&
          formData.securityAnswer3.trim()
        )
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="text-2xl font-bold text-emerald-600 mb-2">ServiceHub</div>
          <p className="text-gray-600 text-sm">Create your account to get started</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {renderStepIndicator()}
          {renderCurrentStep()}

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <div className="ml-auto">
              {currentStep < 4 ? (
                <Button onClick={handleNext} disabled={!canProceed()} className="bg-emerald-600 hover:bg-emerald-700">
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleRegistrationComplete}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processing...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              )}
            </div>
          </div>

          {currentStep === 1 && (
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700">
                Login
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
