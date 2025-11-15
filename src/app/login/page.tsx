"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Leaf, Eye, EyeOff, ArrowLeft, Clock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (data.user && !data.user.email_confirmed_at) {
        setError("Por favor verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.")
        await supabase.auth.signOut()
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      if (error.message === "Invalid login credentials") {
        setError("Las credenciales son erróneas. Por favor verifica tu correo y contraseña.")
      } else {
        setError(error.message || "Error al iniciar sesión")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Mostrar modal de próximamente en lugar de intentar autenticar
    setShowComingSoonModal(true)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4 md:p-6 lg:p-4">
      <div className="w-full max-w-md">
        {/* Botón volver al inicio - oculto en móvil, visible en desktop */}
        <div className="mb-4 hidden lg:block">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        {/* Versión móvil - ocupa toda la pantalla */}
        <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary overflow-y-auto">
          <div className="min-h-screen flex flex-col px-6 py-8">
            {/* Header con logo y botón volver */}
            <div className="flex justify-between items-center mb-12">
              <Link href="/">
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
                    <Leaf className="h-16 w-16 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-display mb-2">
                    ¡Te damos la bienvenida!
                  </h1>
                  <p className="text-white/80 text-base">
                    Ingresa a tu cuenta de VerdeScan
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm text-white text-sm p-4 rounded-xl border border-red-300/30">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-mobile" className="text-white/90 text-sm mb-2 block">
                      Correo electrónico o DNI
                    </Label>
                    <Input
                      id="email-mobile"
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password-mobile" className="text-white/90 text-sm mb-2 block">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-mobile"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresá tu contraseña"
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
                        onClick={togglePasswordVisibility}
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
                  className="w-full h-14 bg-white text-primary hover:bg-white/90 font-semibold text-base rounded-xl shadow-lg mt-6"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-white/90 text-sm hover:text-white underline"
                    onClick={() => router.push('/recuperar-contrasena')}
                  >
                    Recuperar contraseña
                  </button>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-transparent text-white/70">o</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 rounded-xl"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Iniciar sesión con Google
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <span className="text-white/80 text-sm">¿No tenés cuenta? </span>
                  <Link href="/register" className="text-white font-semibold text-sm hover:underline">
                    Crear cuenta
                  </Link>
                </div>

                {/* Acceso Staff */}
                <div className="pt-6 space-y-3">
                  <div className="text-center text-white/60 text-xs mb-3">Acceso Staff</div>
                  <Link href="/promotor/login" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 bg-blue-500/20 backdrop-blur-sm border-blue-300/30 text-white hover:bg-blue-500/30 rounded-xl text-sm"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Soy Promotor / Ecopunto
                    </Button>
                  </Link>

                  <Link href="/admin/login" className="block">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-white/70 hover:text-white hover:bg-white/10 text-xs"
                      size="sm"
                    >
                      Acceso Administrador
                    </Button>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Versión desktop - Card original */}
        <Card className="w-full hidden lg:block">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Leaf className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-display">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-center">
              Ingresa a tu cuenta de VerdeScan
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">¿No tienes cuenta? </span>
            <Link href="/register" className="text-primary hover:underline font-medium">
              Regístrate aquí
            </Link>
          </div>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">Acceso Staff</span>
            </div>
          </div>

          {/* Botón para Promotores/Ecopuntos */}
          <div className="space-y-3">
            <Link href="/promotor/login" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Soy Promotor / Ecopunto
              </Button>
            </Link>

            <Link href="/admin/login" className="block">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
                size="sm"
              >
                Acceso Administrador
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Modal de próximamente */}
      <Dialog open={showComingSoonModal} onOpenChange={setShowComingSoonModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-full">
                <Clock className="h-10 w-10 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Funcionalidad en Desarrollo
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center text-base">
            El inicio de sesión con Google estará disponible próximamente.
          </DialogDescription>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-center text-muted-foreground">
              Mientras tanto, puedes crear una cuenta con tu correo electrónico para comenzar a usar VerdeScan.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => setShowComingSoonModal(false)}
              className="px-8"
              size="lg"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}