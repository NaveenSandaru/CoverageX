"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image";
import { usePathname } from "next/navigation"
import { Menu, User, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import axios from "axios"
import logo from "./../public/simplyBookedLogo.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false)
  const pathname = usePathname()
  const { user, isLoggedIn, accessToken, setUser, setAccessToken } = useAuth()
  const [profilePath, setProfilePath] = useState('');

  const isActive = (path: string) => pathname === path

  const handleSignOut = () => {
    deleteToken();
  }

  const deleteToken = async () => {
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/delete_token`, {
      withCredentials: true
    }
    );
    if (response.status == 200) {
      setUser(null);
      setAccessToken("");
      setIsMobileProfileOpen(false)
    }
  }

  const getUserPic = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/clients/client/${user.email}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setProfilePath(response.data.profile_picture);
    }
    catch (error: any) {
      console.log(error.message)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user?.name || user?.email || "User"
  }

  useEffect(() => {
    getUserPic();
  }, [isLoggedIn]);

  return (
    <header className="w-full border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Mobile Layout */}
        <div className="flex md:hidden h-16 items-center justify-between">
          {/* Left: Hamburger Menu */}
          <div className="flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[70%] sm:w-[300px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col space-y-4 pt-4">
                  {/* Mobile Nav Links */}
                  <nav className="flex flex-col space-y-3 p-4">
                    <Link
                      href="/"
                      className={`py-1 ${isActive("/") ? "text-emerald-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href="/services"
                      className={`py-1 ${isActive("/services") ? "text-emerald-600 font-semibold" : "text-gray-600 hover:text-gray-900"
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      Services
                    </Link>
                  </nav>

                  {/* Mobile Sign In (only when not logged in) */}
                  {!isLoggedIn && (
                    <div className="border-t border-gray-100 pt-4 p-4">
                      <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center">
            <Link href="/">
              <Image
                src={logo}
                alt="Simply Booked Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Right: Sign In Button or User Avatar with Dropdown */}
          <div className="flex items-center">
            {isLoggedIn ? (
              <DropdownMenu open={isMobileProfileOpen} onOpenChange={setIsMobileProfileOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 p-0 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${profilePath}`}
                        alt={getUserName()}
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback className="text-xs">{getUserInitials(getUserName())}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-900">{getUserName()}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center" onClick={() => setIsMobileProfileOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 flex items-center justify-center rounded-full">
                <Link href="/auth/login" className="flex items-center justify-center">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image
                src={logo}
                alt="Simply Booked Logo"
                width={110} // You can adjust size as needed
                height={110}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex justify-center space-x-6">
            <Link
              href="/"
              className={`transition-colors py-1 ${isActive("/")
                ? "text-emerald-600 hover:text-emerald-500 font-semibold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Home
            </Link>
            <Link
              href="/services"
              className={`transition-colors py-1 ${isActive("/services")
                ? "text-emerald-600 hover:text-emerald-500 font-semibold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Services
            </Link>
          </nav>

          {/* Desktop User Profile / Sign In */}
          <div className="flex items-center justify-end">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          profilePath?.startsWith("/uploads")
                            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${profilePath}`
                            : profilePath
                        }
                        alt={getUserName()}
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback className="text-xs">{getUserInitials(getUserName())}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">{getUserName()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center rounded-full">
                <Link href="/auth/login" className="flex items-center justify-center">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
