"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("1. Intentando autenticar con:", email)

      // Intentar iniciar sesión con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("2. Resultado de autenticación:", { authData, authError })

      if (authError) {
        console.error("Error de autenticación:", authError)
        throw new Error(authError.message || "Error al autenticar")
      }

      if (!authData.user) {
        throw new Error("No se pudo iniciar sesión")
      }

      console.log("3. Usuario autenticado:", authData.user.id)

      // Verificar que el usuario sea administrador
      console.log("4. Verificando rol de administrador...")
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single()

      console.log("5. Resultado de consulta de usuario:", { userData, userError })

      if (userError) {
        console.error("Error al obtener datos del usuario:", userError)

        // Si el error es porque no existe el perfil, dar más información
        if (userError.code === 'PGRST116') {
          throw new Error("Tu cuenta no tiene un perfil creado. Por favor, contacta al soporte.")
        }

        throw new Error(userError.message || "Error al verificar permisos")
      }

      if (!userData) {
        throw new Error("No se encontró información del usuario")
      }

      console.log("6. Rol del usuario:", (userData as any).role)

      if ((userData as any).role !== "admin") {
        await supabase.auth.signOut()
        throw new Error(`No tienes permisos de administrador. Tu rol actual es: ${(userData as any).role}`)
      }

      console.log("7. Acceso autorizado, redirigiendo...")

      // Redirigir al panel de administrador
      router.push("/admin/dashboard")
    } catch (err) {
      console.error("Error completo:", err)

      let errorMessage = "Error desconocido al iniciar sesión"

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err)
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-12 md:px-6 lg:px-4">
      <div className="w-full max-w-md">
        {/* Versión móvil - ocupa toda la pantalla */}
        <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary overflow-y-auto">
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
                    <Shield className="h-16 w-16 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-display mb-2">
                    Panel de Administrador
                  </h1>
                  <p className="text-white/80 text-base">
                    Ingresa tus credenciales de admin
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
                    <Label htmlFor="email-mobile" className="text-white/90 text-sm mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email de Administrador
                    </Label>
                    <Input
                      id="email-mobile"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                    <Input
                      id="password-mobile"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-white text-primary hover:bg-white/90 font-semibold text-base rounded-xl shadow-lg mt-6"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                <Link href="/login" className="block pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 rounded-xl"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Login de Usuario
                  </Button>
                </Link>
              </form>
            </div>
          </div>
        </div>

        {/* Versión desktop - Card original */}
        <Card className="w-full max-w-md shadow-2xl hidden lg:block">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Panel de Administrador</CardTitle>
            <CardDescription className="text-gray-600">
              Ingresa tus credenciales para acceder al panel
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
                <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-gray-700">
                  <Lock className="h-4 w-4" />
                  Ingresá tu contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold"
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>

              <Link href="/login" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-6 text-base"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Login de Usuario
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
