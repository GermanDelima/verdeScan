"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  QrCode,
  Trophy,
  Leaf,
  MapPin,
  Menu,
  X,
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/scan", label: "Escanear QR", icon: QrCode },
  { href: "/dashboard/raffles", label: "Sorteos", icon: Trophy },
  { href: "/dashboard/leaderboard", label: "Ranking de Barrios", icon: MapPin },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Barra inferior con notificaciones y menú - Solo móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white px-6 py-4 shadow-lg lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {/* Botón de notificaciones */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-12 w-12 rounded-full hover:bg-gray-100"
          >
            <Bell className="h-6 w-6 text-gray-700" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500"></span>
          </Button>

          {/* Botón de menú hamburguesa */}
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-green-600 shadow-md hover:bg-green-700"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </Button>
        </div>
      </div>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Barra lateral */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r bg-gradient-to-b from-green-50 to-white shadow-lg transition-transform duration-300 lg:relative lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b bg-white px-6">
          <Leaf className="h-8 w-8 text-green-600" />
          <h1 className="font-display text-xl font-bold text-green-700">
            VerdeScan
          </h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t bg-white p-4">
          <div className="rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 p-4 text-sm">
            <p className="font-semibold text-green-800">¡Sigue reciclando!</p>
            <p className="text-xs text-green-700">
              Cada acción cuenta para un planeta mejor
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
