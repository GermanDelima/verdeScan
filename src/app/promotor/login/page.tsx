"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Lock, User, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PromotorLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("1. Intentando autenticar promotor/ecopunto:", username)

      const response = await fetch('/api/promotor/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()
      console.log("2. Respuesta de autenticación:", data)

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

      // Guardar datos de sesión en localStorage
      localStorage.setItem('staff_session', JSON.stringify({
        id: data.account.id,
        username: data.account.username,
        account_type: data.account.account_type,
        loginTime: new Date().toISOString()
      }))

      console.log("3. Sesión guardada, redirigiendo...")

      // Redirigir al dashboard de promotor
      router.push("/promotor/dashboard")
    } catch (err) {
      console.error("Error de inicio de sesión:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 px-4 py-12 md:px-6 lg:px-4">
      <div className="w-full max-w-md">
        {/* Versión móvil - ocupa toda la pantalla */}
        <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 overflow-y-auto">
          <div className="min-h-screen flex flex-col px-6 py-8">
            {/* Header con botón volver */}
            <div className="flex justify-between items-center mb-12">
              <Link href="/login">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
            </div>

            {/* Logo y título centrados */}
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-white/20 backdrop-blur-sm p-5 rounded-3xl">
                    <Users className="h-16 w-16 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-display mb-2">
                    Promotores y Ecopuntos
                  </h1>
                  <p className="text-white/80 text-base">
                    Ingresa con tu usuario y contraseña
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-300/30 p-4">
                    <AlertCircle className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username-mobile" className="text-white/90 text-sm mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre de Usuario
                    </Label>
                    <Input
                      id="username-mobile"
                      type="text"
                      placeholder="usuario123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password-mobile" className="text-white/90 text-sm mb-2 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-mobile"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl pr-12 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-white text-blue-600 hover:bg-white/90 font-semibold text-base rounded-xl shadow-lg mt-6"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                {/* Información adicional */}
                <div className="mt-6 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 p-4">
                  <p className="text-xs text-white/90 text-center">
                    Si no tienes cuenta, contacta al administrador del sistema
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Versión desktop - Card original */}
        <Card className="w-full max-w-md shadow-2xl hidden lg:block relative">
          <CardHeader className="space-y-4 text-center">
            {/* Botón para volver */}
            <Link
              href="/login"
              className="absolute left-4 top-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Acceso Promotores y Ecopuntos
            </CardTitle>
            <CardDescription className="text-gray-600">
              Ingresa con tu usuario y contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4" />
                  Nombre de Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="usuario123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-gray-700">
                  <Lock className="h-4 w-4" />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>

              {/* Información adicional */}
              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs text-blue-800 text-center">
                  Si no tienes cuenta, contacta al administrador del sistema
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
