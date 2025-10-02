"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Facebook, Instagram, Twitter } from "lucide-react"
import logo from "./../public/simplyBookedLogo.png"

export default function Footer() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <footer className="bg-white">
      {/* Name and separator line */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex items-center mb-8 space-x-4">
          <Image
            src={logo}
            alt="Simply Booked Logo"
            width={110}
            height={110}
            className="object-contain"
          />
          <hr className="flex-1 border-gray-200" />
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Description */}
          <div className="md:col-span-1">
            <p className="text-sm text-gray-600 leading-relaxed">
              Your trusted partner for booking appointments, offering top-tier professionals and seamless scheduling to
              make every experience exceptional.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className={`text-sm ${
                    isActive("/") ? "text-emerald-600 hover:text-emerald-500 font-semibold" : "text-gray-600 hover:text-gray-900" 
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className={`text-sm  ${
                    isActive("/services") ? "text-emerald-600 hover:text-emerald-500 font-semibold" : "text-gray-600 hover:text-gray-900" 
                  }`}
                >
                  Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support & Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/faq"
                  className={`text-sm hover:text-gray-900 ${
                    isActive("/faq") ? "text-green-600 font-medium" : "text-gray-600"
                  }`}
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className={`text-sm hover:text-gray-900 ${
                    isActive("/support") ? "text-green-600 font-medium" : "text-gray-600"
                  }`}
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/partnership"
                  className={`text-sm hover:text-gray-900 ${
                    isActive("/partnership") ? "text-green-600 font-medium" : "text-gray-600"
                  }`}
                >
                  Partnership Programs
                </Link>
              </li>
            </ul>
          </div>

          {/* Social links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Social</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 justify-center md:justify-start"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 justify-center md:justify-start"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 justify-center md:justify-start"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#1C614C] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-row justify-between items-center text-center">
          <p className="text-sm">© Dynamic Calendar 2025</p>
          <div className="flex space-x-4 sm:space-x-6">
            <Link
              href="/terms"
              className={`text-sm hover:text-green-950 ${
                isActive("/terms") ? "text-white font-medium" : "text-green-100"
              }`}
            >
              Terms
            </Link>
            <Link
              href="/support"
              className={`text-sm hover:text-green-950 ${
                isActive("/support") ? "text-white font-medium" : "text-green-100"
              }`}
            >
              Support
            </Link>
            <Link
              href="/sitemap"
              className={`text-sm hover:text-green-950 ${
                isActive("/sitemap") ? "text-white font-medium" : "text-green-100"
              }`}
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
