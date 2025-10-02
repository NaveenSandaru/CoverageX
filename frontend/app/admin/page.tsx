"use client"

import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import axios from 'axios';
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { AuthContext } from '@/context/auth-context';

export default function AdminLoginPage() {
  const {accessToken, user, setUser, setAccessToken } = useContext(AuthContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = async () => {
    if (!id || !password) {
      toast.error("Required Fields Missing", {
        description: "Please enter both email and password"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/admin_login`,
        {
          id: id,
          password: password
        },
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );

      if (response.data.successful && response.data.user.role === "admin") {
        toast.success("Login Successful", {
          description: "Welcome to Admin Dashboard"
        });
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        router.push("/admin/dashboard");
      } else {
        throw new Error("Unauthorized access");
      }
    } catch (error: any) {
      setUser(null);
      setAccessToken("");
      toast.error("Login Failed", {
        description: "Invalid admin credentials"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogin = async () => {
    if(user && user.role == "admin" && accessToken){
      router.push("/admin/dashboard");
    }
  }

  useEffect(()=>{
    if(user != null){
      handleAutoLogin();
    }
  },[user])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="text-2xl font-bold text-blue-600 mb-2">Admin Portal</div>
          <p className="text-gray-600 text-sm">Please login with your admin credentials</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Admin ID
            </Label>
            <Input
              id="id"
              type="text"
              placeholder="Enter admin ID"
              className="w-full"
              value={id}
              onChange={(e) => setId(e.target.value)}
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
                placeholder="Enter password"
                className="w-full pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              {password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleAdminLogin}
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-800 text-white rounded-lg transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login to Admin Panel'
            )}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
