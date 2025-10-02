"use client"

import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import Link from "next/link"
import Image from 'next/image';
import { AuthContext } from '@/context/auth-context';
import axios from 'axios';
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { signIn } from "next-auth/react";
import logo from "./../../../../public/simplyBookedLogo.png"

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { isLoggedIn, user, setUser, setAccessToken } = useContext(AuthContext);

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleLogin = async () => {
    await signIn("google", {
      callbackUrl: "/auth/login/google-login", // <- redirect here after Google login
    });
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
        {
          email: email,
          password: password,
          checked: remember
        },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );
      if (response.data.successful && response.data.user.role == "client") {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        toast.success("Login Successful", {
          description: "Logged in as a client"
        });
        router.push("/");
      }
      if (response.data.successful && response.data.user.role == "sp") {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        toast.success("Login Successful", {
          description: "Logged in as a service provider"
        });
        router.push("/serviceproviderdashboard");
      }
      else {
        console.log(response.data.error)
        throw new Error("Invalid Credentials");
      }
    }
    catch (error: any) {
      console.log(error);
      toast.error("Login Failed", {
        description: error.message || "Invalid credentials"
      });
    }
    finally {
      setIsLoading(false);
    }
  }

  const handleForgotPassword = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!email.trim()) {
      e.preventDefault();
      toast.error("Email Required", {
        description: "Please enter your email address before resetting the password."
      });
      return;
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
        <div className="w-full flex justify-center mb-2">
            <Image
              src={logo}
              alt="Simply Booked Logo"
              width={110}
              height={110}
              className="object-contain"
            />
          </div>
          <p className="text-gray-600 text-sm">Welcome back! Please login to your account.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full"
              value={email}
              onChange={(e) => { setEmail(e.target.value) }}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full pr-10"
                value={password}
                onChange={(e) => { setPassword(e.target.value) }}
                disabled={isLoading}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm text-[#0eb882] ">
                Remember me
              </Label>
            </div>
            <Link
              href={`/auth/forgotpassword?email=${encodeURIComponent(email)}`}
              className="text-sm text-[#12D598] hover:text-[#0eb882]"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </Link>
          </div>

          <LoadingButton
            className="w-full bg-[#059669] hover:bg-[#0eb882] text-white"
            onClick={handleLogin}
            isLoading={isLoading}
            loadingText="Logging in..."
          >
            Login
          </LoadingButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
            Google
          </Button>

          <p className="text-center text-sm text-gray-600">
            {"Don't have an account? "}
            <Link href="/auth/account-selection" className="text-[#12D598] hover:text-green-700">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
