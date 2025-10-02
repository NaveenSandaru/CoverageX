"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload, Building, Shield, CheckCircle, Mail, AlertCircle, Info, ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toNamespacedPath } from "path/win32"
import { LoadingButton } from "@/components/ui/loading-button"


type Step = 1 | 2 | 3 | 4

interface SecurityQuestion {
  question_id: string;
  question: string;
}

interface ProviderFormData {
  // Personal Info
  image: File | null
  firstName: string
  lastName: string
  email: string
  preferredLanguages: string
  password: string
  confirmPassword: string
  // Company Info
  companyName: string
  companyAddress: string
  companyNumber: string
  serviceType: string
  serviceSpecialty: string
  appointmentDuration: string
  appointmentFee: number
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
  companyAddress?: string
  companyNumber?: string
  securityAnswer1?: string
  securityAnswer2?: string
  securityAnswer3?: string
}

// Add Service interface
interface Service {
  service_id: string
  service: string
  picture?: string
  description?: string
}

export default function ProviderRegistration() {
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([])
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState<ProviderFormData>({
    image: null,
    firstName: "",
    lastName: "",
    email: "",
    preferredLanguages: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyAddress: "",
    companyNumber: "",
    serviceType: "",
    serviceSpecialty: "",
    appointmentDuration: "30",
    appointmentFee: 0,
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
  const [otpTimer, setOtpTimer] = useState(0)
  const [canResendOtp, setCanResendOtp] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isEmailUnique, setIsEmailUnique] = useState<boolean | null>(null)

  const router = useRouter()

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const steps = [
    { number: 1, title: "Personal Info", icon: Building },
    { number: 2, title: "Company Info", icon: Building },
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

        setPasswordStrength(checkPasswordStrength(value))

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
          fieldErrors.confirmPassword = undefined
        }
        break
      case "companyName":
        if (!value.trim()) {
          fieldErrors.companyName = "Company name is required"
        }
        break
      case "companyAddress":
        if (!value.trim()) {
          fieldErrors.companyAddress = "Company address is required"
        }
        break
      case "companyNumber":
        if (!value.trim()) {
          fieldErrors.companyNumber = "Company number is required"
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
    if (name === 'email') {
      setIsEmailUnique(null); // Reset email uniqueness check when email changes
    }
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }))
    }
  }

  const handleFieldBlur = async (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const fieldErrors = validateField(name, formData[name as keyof ProviderFormData] as string)
    setErrors((prev) => ({ ...prev, ...fieldErrors }))

    // Check email existence on blur if it's a valid email
    if (name === 'email' && formData.email && isValidEmail(formData.email)) {

    }
  }

  const handlePasswordChange = (value: string) => {
    setFormData((prev) => ({ ...prev, password: value }))
    setPasswordStrength(checkPasswordStrength(value))

    if (formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
      }
    }

    // Clear password error if valid
    if (value.length >= 8) {
      setErrors((prev) => ({ ...prev, password: undefined }))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setFormData((prev) => ({ ...prev, confirmPassword: value }))

    if (value !== formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const validateStep = async () => {
    const stepErrors: FormErrors = {}
    let isValid = true

    switch (currentStep) {
      case 1:
        // Personal Info Validation
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
        break

      case 2:
        // Company Info Validation
        if (!formData.companyName.trim()) {
          stepErrors.companyName = "Company name is required"
          isValid = false
        }
        if (!formData.companyAddress.trim()) {
          stepErrors.companyAddress = "Company address is required"
          isValid = false
        }
        if (!formData.companyNumber.trim()) {
          stepErrors.companyNumber = "Company number is required"
          isValid = false
        }
        if (!formData.serviceType) {
          toast.error("Service Type Required", {
            description: "Please select a service type"
          });
          isValid = false
        }
        if (!formData.workHoursFrom || !formData.workHoursTo) {
          toast.error("Work Hours Required", {
            description: "Please specify your working hours"
          });
          isValid = false
        }
        if (!formData.weekDaysFrom || !formData.weekDaysTo) {
          toast.error("Work Days Required", {
            description: "Please specify your working days"
          });
          isValid = false
        }
        // Validate appointment fee
        if (typeof formData.appointmentFee !== 'number' || isNaN(formData.appointmentFee)) {
          toast.error("Invalid Appointment Fee", {
            description: "Please enter a valid appointment fee"
          });
          isValid = false
        }
        break

      case 3:
        if (!isRecaptchaVerified) {
          toast.error("reCAPTCHA Required", {
            description: "Please complete the reCAPTCHA verification"
          })
          isValid = false
        }
        if (!isEmailVerified) {
          toast.error("Email Verification Required", {
            description: "Please verify your email address"
          })
          isValid = false
        }
        break

      case 4:
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
        // Check if security questions are unique
        const questions = [formData.securityQuestion1, formData.securityQuestion2, formData.securityQuestion3];
        const uniqueQuestions = new Set(questions);
        if (uniqueQuestions.size !== 3) {
          toast.error("Duplicate Security Questions", {
            description: "Please select different questions for each answer"
          });
          isValid = false;
        }
        break
    }

    setErrors((prev) => ({ ...prev, ...stepErrors }))
    return isValid
  }

  const handleNext = async () => {
    const isValid = await validateStep();
    
    // Special handling for step 1 when email exists
    if (currentStep === 1 && isEmailUnique === false) {
      toast.error("Email Already Registered", {
        description: "This email is already in use. Please use a different email address or login to your existing account.",
      });
      return; // Don't proceed to next step
    }
    
    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step)
      setTouched({})
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
      setTouched({})
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please select an image smaller than 5MB",
        })
        return
      }

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

  const sendOtpToEmail = async () => {
    if (!formData.email) {
      toast.error("Email Required", {
        description: "Please enter your email address first.",
      })
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address.",
      })
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-verification`,
        {
          email: formData.email
        },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );
      if (response.status == 201) {
        toast.success("OTP Sent", {
          description: `A 6-digit verification code has been sent to ${formData.email}`,
        });
        setOtpSent(true);
      }
      else {
        const error = new Error("Server Error") as Error & { details?: string }
        error.details = "Verification code not sent, please retry";
        throw error;
      }
    }
    catch (error: any) {
      toast.error(error.message, {
        description: error.details
      });
    } finally {
      setIsSendingOtp(false);
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const verifyOtp = async () => {
    const enteredOtp = otp.join("");
    setIsVerifyingOtp(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/email-verification/verify`,
        {
          email: formData.email,
          code: enteredOtp
        },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );
      if (response.data.message == "Email verified successfully") {
        setIsEmailVerified(true);
        toast.success("Success", {
          description: "Email verified successfully, Please continue.",
        });
      }
      else {
        const error = new Error("Verification Failed") as Error & { details?: string }
        error.details = "Verification code is not verified. Please retry";
        throw error;
      }
    }
    catch (error: any) {
      toast.error(error.message, {
        description: error.details,
      })
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  const resendOtp = () => {
    if (canResendOtp) {
      sendOtpToEmail()
      setOtp(["", "", "", "", "", ""])
    }
  }

  const handleRegistrationComplete = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    try {
      // Ensure appointment fee is a valid integer
      const appointmentFeeInt = Math.max(0, Math.round(Number(formData.appointmentFee))) || 0;
      
      // Step 1: Register the service provider
      const registrationData = {
        dataToSend: {
          email: formData.email,
          name: formData.firstName + " " + formData.lastName,
          company_phone_number: formData.companyNumber || "temp",
          profile_picture: null,
          company_address: formData.companyAddress || "temp",
          password: formData.password,
          language: formData.preferredLanguages || "temp",
          service_type: formData.serviceType || "temp",
          specialization: formData.serviceSpecialty || "temp",
          work_days_from: formData.weekDaysFrom,
          work_days_to: formData.weekDaysTo,
          work_hours_from: formData.workHoursFrom,
          work_hours_to: formData.workHoursTo,
          appointment_duration: formData.appointmentDuration + " minutes",
          company_name: formData.companyName,
          appointment_fee: appointmentFeeInt
        }
      };

      try {
        const registrationResponse = await axios.post(
          `${baseUrl}/service-providers`,
          registrationData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // If registration is successful, proceed with security questions
        try {
          await Promise.all([
            axios.post(`${baseUrl}/service-provider-questions`, {
              email: formData.email,
              question_id: formData.securityQuestion1,
              answer: formData.securityAnswer1.trim()
            }, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            }),
            axios.post(`${baseUrl}/service-provider-questions`, {
              email: formData.email,
              question_id: formData.securityQuestion2,
              answer: formData.securityAnswer2.trim()
            }, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            }),
            axios.post(`${baseUrl}/service-provider-questions`, {
              email: formData.email,
              question_id: formData.securityQuestion3,
              answer: formData.securityAnswer3.trim()
            }, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            })
          ]);

          // If everything is successful, handle profile picture upload
          if (formData.image) {
            try {
              const imageFormData = new FormData();
              imageFormData.append("image", formData.image);

              const uploadResponse = await axios.post(`${baseUrl}/photos`, imageFormData, {
                withCredentials: true,
                headers: {
                  "Content-Type": "multipart/form-data"
                }
              });

              if (uploadResponse.data?.url) {
                await axios.put(`${baseUrl}/service-providers`, {
                  email: formData.email,
                  profile_picture: uploadResponse.data.url
                }, {
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
              }
            } catch (imageError) {
              console.error("Error uploading profile picture:", imageError);
              toast.error("Profile Picture Upload Failed", {
                description: "Your account was created, but we couldn't upload your profile picture. You can add it later from your profile settings."
              });
            }
          }

          // Final success message
          toast.success("Registration Successful!", {
            description: "Your service provider account has been created successfully. Redirecting to login..."
          });

          // Redirect after a short delay
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);

        } catch (securityQuestionsError) {
          // If security questions fail, delete the created user
          console.error("Error submitting security questions:", securityQuestionsError);
          try {
            await axios.delete(`${baseUrl}/service-providers`, {
              data: { email: formData.email },
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            toast.error("Registration Failed", {
              description: "Failed to save security questions. Please try registering again."
            });
          } catch (deleteError) {
            console.error("Error during cleanup:", deleteError);
            toast.error("Registration Error", {
              description: "An error occurred during registration. Please contact support."
            });
          }
        }

      } catch (error: unknown) {
        // Handle specific registration errors
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 409) {
            toast.error("Email Already Registered", {
              description: "This email address is already in use. Please use a different email or login to your existing account."
            });
          } else if (error.response?.status === 400) {
            toast.error("Invalid Data", {
              description: error.response.data.error || "Please check all required fields and try again."
            });
          } else if (error.code === 'ERR_NETWORK') {
            toast.error("Network Error", {
              description: "Unable to connect to the server. Please check your internet connection and try again."
            });
          } else {
            toast.error("Registration Failed", {
              description: "An unexpected error occurred. Please try again later."
            });
          }
        } else {
          toast.error("Registration Failed", {
            description: "An unexpected error occurred. Please try again later."
          });
        }
      } finally {
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration Failed", {
        description: "An unexpected error occurred. Please try again later."
      });
    }
  };

  const getAllQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const response = await axios.get(`${baseUrl}/security-questions`);

      if (response.data && Array.isArray(response.data)) {
        setSecurityQuestions(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setSecurityQuestions(response.data.data);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("Error fetching security questions:", error);
      toast.error("Error loading security questions", {
        description: error.response?.data?.error || error.message || "Please check your connection and try again"
      });
      // Set default questions for development/testing
      setSecurityQuestions([
        { question_id: "1", question: "What was your first pet's name?" },
        { question_id: "2", question: "What city were you born in?" },
        { question_id: "3", question: "What is your mother's maiden name?" },
        { question_id: "4", question: "What was your first school's name?" },
        { question_id: "5", question: "What is your favorite book?" }
      ]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Update the services fetching useEffect
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        const response = await axios.get(`${baseUrl}/services`);

        if (response.data && Array.isArray(response.data)) {
          setServices(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setServices(response.data.data);
        } else {
          throw new Error("Invalid data format received from server");
        }
      } catch (error: any) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services', {
          description: error.response?.data?.error || error.message || "Failed to connect to server. Please try again."
        });
        // Set default services for development/testing
        setServices([
          { service_id: "1", service: "Medical Service" },
          { service_id: "2", service: "Legal Service" },
          { service_id: "3", service: "Educational Service" }
        ]);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Make sure to call getAllQuestions when component mounts
  useEffect(() => {
    getAllQuestions();
  }, []);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.number
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-gray-300 text-gray-400"
              }`}
          >
            {currentStep > step.number ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <step.icon className="w-5 h-5" />
            )}
          </div>

          {/* Hide on mobile, show on md+ */}
          <span
            className={`ml-2 text-sm hidden md:inline ${currentStep >= step.number ? "text-emerald-600 font-medium" : "text-gray-400"
              }`}
          >
            {step.title}
          </span>

          {/* Connecting line */}
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 mx-2 md:mx-4 ${currentStep > step.number ? "bg-emerald-600" : "bg-gray-300"}`}
              style={{ width: '2rem' }} // fallback width
            />
          )}
        </div>
      ))}
    </div>
  );


  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null
    return (
      <div className="flex items-center mt-1 text-red-500 text-sm">
        <AlertCircle className="w-3 h-3 mr-1" />
        <span>{message}</span>
      </div>
    )
  }

  const renderPasswordStrengthIndicator = () => {
    if (!formData.password) return null

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
          <div
            className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`}
          />
        </div>
        <div className="flex items-center mt-1 text-xs">
          <span className={`
            ${passwordStrength === "weak" ? "text-red-500" : ""}
            ${passwordStrength === "medium" ? "text-yellow-500" : ""}
            ${passwordStrength === "strong" ? "text-green-500" : ""}
          `}>
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
    if (!formData.password || !formData.confirmPassword) return null

    const passwordsMatch = formData.password === formData.confirmPassword

    return (
      <div className="mt-1">
        <div className="flex items-center text-xs">
          {passwordsMatch ? (
            <div className="text-green-500 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span>Passwords match</span>
            </div>
          ) : (
            <div className="text-red-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>Passwords do not match</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Personal Information</h2>
      <p className="text-center text-gray-600">Create your service provider account to offer your services</p>

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
            required
          />
          <ErrorMessage message={touched.lastName ? errors.lastName : undefined} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email" className="flex items-center">
          Email <span className="text-red-500 ml-1">*</span>
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            onBlur={() => handleFieldBlur("email")}
            placeholder="Enter your email"
            className={`${errors.email || isEmailUnique === false ? "border-red-500" : ""} ${isEmailUnique === true ? "border-green-500" : ""}`}
            required
          />
          {isEmailUnique === false && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>This email is already registered. Please use a different email or login to your existing account.</span>
            </div>
          )}
          {isEmailUnique === true && (
            <div className="flex items-center mt-1 text-green-500 text-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span>Email is available</span>
            </div>
          )}
          <ErrorMessage message={touched.email ? errors.email : undefined} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="preferredLanguages">Preferred Languages</Label>
        <Input
          id="preferredLanguages"
          value={formData.preferredLanguages}
          onChange={(e) => setFormData({ ...formData, preferredLanguages: e.target.value })}
          placeholder="e.g., English, Spanish, French"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="password" className="flex items-center">
            Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleFieldBlur("password")}
              placeholder="Enter your password (min 8 characters)"
              className={errors.password && touched.password ? "border-red-500 pr-10" : "pr-10"}
              required
            />
            {formData.password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            )}
          </div>
          <ErrorMessage message={touched.password ? errors.password : undefined} />
          {renderPasswordStrengthIndicator()}
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="flex items-center">
            Confirm Password <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              onBlur={() => handleFieldBlur("confirmPassword")}
              placeholder="Confirm your password"
              className={errors.confirmPassword && touched.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              required
            />
            {formData.confirmPassword && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            )}
          </div>
          <ErrorMessage message={touched.confirmPassword ? errors.confirmPassword : undefined} />
          {formData.confirmPassword && renderPasswordMatchIndicator()}
        </div>
      </div>
    </div>
  )

  const renderCompanyInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-gray-900">Company Information</h2>
      <p className="text-center text-gray-600">Tell us about your business and services</p>

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
          {isLoadingServices ? (
            <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              <span className="text-sm text-gray-500">Loading services...</span>
            </div>
          ) : (
            <Select
              value={formData.serviceType}
              onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.service_id} value={service.service_id}>
                    {service.service}
                    {/*service.description && (
                      <span className="ml-2 text-sm text-gray-500">({service.description})</span>
                    )*/}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
        <Label htmlFor="appointmentDuration">Appointment Duration (minutes)</Label>
        <Input
          id="appointmentDuration"
          type="number"
          min="15"
          step="15"
          value={formData.appointmentDuration}
          onChange={(e) => setFormData({ ...formData, appointmentDuration: e.target.value })}
          placeholder="Enter appointment duration in minutes"
        />
        <p className="text-sm text-gray-500">Minimum duration: 15 minutes</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="appointmentFee" className="flex items-center">
          Appointment Fee (USD) <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="appointmentFee"
          type="number"
          min="0"
          step="1"
          value={formData.appointmentFee}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value;
            const numValue = rawValue === '' ? 0 : Math.max(0, Math.round(Number(rawValue)));
            setFormData(prev => ({ ...prev, appointmentFee: numValue }));
          }}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            // Ensure the value is set to 0 if empty or invalid
            const currentValue = e.target.value;
            if (currentValue === '' || isNaN(Number(currentValue))) {
              setFormData(prev => ({ ...prev, appointmentFee: 0 }));
            }
          }}
          placeholder="Enter fee in USD (whole numbers only)"
          required
        />
        <p className="text-sm text-gray-500">Enter the appointment fee in whole numbers (minimum 0)</p>
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
              <LoadingButton
                onClick={sendOtpToEmail}
                disabled={!isRecaptchaVerified || !formData.email}
                className="w-full"
                isLoading={isSendingOtp}
                loadingText="Sending verification code..."
              >
                Send Verification Code
              </LoadingButton>
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
                      disabled={isEmailVerified || isVerifyingOtp}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">{otpTimer > 0 && `Resend available in ${otpTimer}s`}</div>
                  <LoadingButton
                    variant="link"
                    onClick={resendOtp}
                    disabled={!canResendOtp}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                    isLoading={isSendingOtp}
                    loadingText="Sending..."
                  >
                    Resend Code
                  </LoadingButton>
                </div>

                {!isEmailVerified ? (
                  <LoadingButton
                    onClick={verifyOtp}
                    disabled={otp.some((digit) => !digit)}
                    className="w-full"
                    isLoading={isVerifyingOtp}
                    loadingText="Verifying..."
                  >
                    Verify Code
                  </LoadingButton>
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

      {isLoadingQuestions && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-2 text-gray-600">Loading security questions...</p>
        </div>
      )}

      {!isLoadingQuestions && securityQuestions.length === 0 && (
        <div className="text-center py-4 text-amber-600">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Unable to load security questions. Please try again.</p>
          <Button onClick={getAllQuestions} variant="outline" className="mt-2">
            Retry Loading Questions
          </Button>
        </div>
      )}

      {!isLoadingQuestions && securityQuestions.length > 0 && (
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
              <SelectTrigger>
                <SelectValue placeholder="Select a security question" />
              </SelectTrigger>
              <SelectContent>
                {securityQuestions.map((question) => (
                  <SelectItem key={question.question_id} value={question.question_id}>
                    {question.question}
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
              <SelectTrigger>
                <SelectValue placeholder="Select a security question" />
              </SelectTrigger>
              <SelectContent>
                {securityQuestions
                  .filter((q) => q.question_id !== formData.securityQuestion1)
                  .map((question) => (
                    <SelectItem key={question.question_id} value={question.question_id}>
                      {question.question}
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
              <SelectTrigger>
                <SelectValue placeholder="Select a security question" />
              </SelectTrigger>
              <SelectContent>
                {securityQuestions
                  .filter((q) => q.question_id !== formData.securityQuestion1 && q.question_id !== formData.securityQuestion2)
                  .map((question) => (
                    <SelectItem key={question.question_id} value={question.question_id}>
                      {question.question}
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
              required
            />
            <ErrorMessage message={touched.securityAnswer3 ? errors.securityAnswer3 : undefined} />
          </div>
        </div>
      )}
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfo()
      case 2:
        return renderCompanyInfo()
      case 3:
        return renderVerification()
      case 4:
        return renderSecurity()
      default:
        return renderPersonalInfo()
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.firstName.trim() &&
          formData.lastName.trim() &&
          formData.email.trim() &&
          isValidEmail(formData.email) &&
          formData.password.trim() &&
          formData.confirmPassword.trim() &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 8
        )
      case 2:
        return formData.companyName.trim()
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
          <div className="flex items-center justify-center mb-4">
            <Link href="/auth/account-selection" className="flex items-center text-emerald-600 hover:text-emerald-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account Selection
            </Link>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mb-2">Service Provider Registration</div>
          <p className="text-gray-600 text-sm">Create your provider account to offer your services</p>
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
                      Creating Account...
                    </>
                  ) : (
                    "Create Provider Account"
                  )}
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
