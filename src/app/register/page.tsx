// @ts-nocheck
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/supabase/client"
import { AuthError } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { POSADAS_NEIGHBORHOODS } from "@/lib/neighborhoods"
import { Leaf, Eye, EyeOff, Clock, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    // Validar longitud de la contraseña
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    // Validar barrio
    if (!neighborhood) {
      setError("Por favor selecciona tu barrio")
      setLoading(false)
      return
    }

    try {
      // Crear usuario de autenticación
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: name,
            neighborhood: neighborhood,
          },
        },
      })

      if (authError) throw authError

      // Verificar si el usuario ya existe (Supabase devuelve usuario pero con email existente)
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        setError("Ya existe una cuenta con este correo electrónico. Por favor inicia sesión.")
        setLoading(false)
        return
      }

      // Verificar si se requiere confirmación de email
      if (authData.user && !authData.session) {
        // Se requiere confirmación de email
        setSuccess(true)
      } else if (authData.user && authData.session) {
        // Auto-login habilitado (no se requiere confirmación de email)
        // Crear perfil de usuario en la tabla users
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email: email,
            name: name,
            neighborhood: neighborhood,
            points: 0,
          })

        if (profileError) {
          console.error("Error al crear el perfil de usuario:", profileError)
        }

        // Redirigir al panel de control
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || "Error al registrar usuario")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Mostrar modal de próximamente en lugar de intentar autenticar
    setShowComingSoonModal(true)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4">
        {/* Versión móvil */}
        <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary overflow-y-auto">
          <div className="min-h-screen flex flex-col px-6 py-8 justify-center">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm p-5 rounded-3xl">
                  <Leaf className="h-16 w-16 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-display mb-2">
                  ¡Cuenta Creada!
                </h1>
                <p className="text-white/80 text-base">
                  Te hemos enviado un correo de verificación
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm p-5 rounded-xl">
                <p className="font-semibold mb-3 text-base">Verifica tu correo electrónico</p>
                <p className="text-white/90 leading-relaxed">
                  Hemos enviado un enlace de verificación a <strong className="text-white">{email}</strong>.
                  Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
                </p>
              </div>
              <div className="text-sm text-white/70 text-center">
                <p>¿No recibiste el correo? Revisa tu carpeta de spam.</p>
              </div>
              <div className="text-center pt-4">
                <Link href="/login">
                  <Button className="w-full h-14 bg-white text-primary hover:bg-white/90 font-semibold text-base rounded-xl shadow-lg">
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Versión desktop */}
        <Card className="w-full max-w-md hidden lg:block">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Leaf className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-display">
              ¡Cuenta Creada!
            </CardTitle>
            <CardDescription className="text-center">
              Te hemos enviado un correo de verificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-4 rounded-md">
              <p className="font-semibold mb-2">Verifica tu correo electrónico</p>
              <p>
                Hemos enviado un enlace de verificación a <strong>{email}</strong>.
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </p>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              <p>¿No recibiste el correo? Revisa tu carpeta de spam.</p>
            </div>
            <div className="text-center">
              <Link href="/login" className="text-primary hover:underline font-medium">
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            {/* Header con botón volver */}
            <div className="flex justify-between items-center mb-8">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
            </div>

            {/* Logo y título */}
            <div className="text-center space-y-6 mb-8">
              <div className="flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm p-5 rounded-3xl">
                  <Leaf className="h-16 w-16 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-display mb-2">
                  Crear Cuenta
                </h1>
                <p className="text-white/80 text-base">
                  Únete a la comunidad de VerdeScan
                </p>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleRegister} className="space-y-5 flex-1">
              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm text-white text-sm p-4 rounded-xl border border-red-300/30">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name-mobile" className="text-white/90 text-sm mb-2 block">
                    Nombre completo
                  </Label>
                  <Input
                    id="name-mobile"
                    type="text"
                    placeholder="Nombre del usuario"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
                  />
                </div>

                <div>
                  <Label htmlFor="email-mobile" className="text-white/90 text-sm mb-2 block">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email-mobile"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood-mobile" className="text-white/90 text-sm mb-2 block">
                    Barrio
                  </Label>
                  <Select
                    value={neighborhood}
                    onValueChange={setNeighborhood}
                    disabled={loading}
                  >
                    <SelectTrigger id="neighborhood-mobile" className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl focus:ring-2 focus:ring-white/50">
                      <SelectValue placeholder="Selecciona tu barrio" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSADAS_NEIGHBORHOODS.map((barrio) => (
                        <SelectItem key={barrio} value={barrio}>
                          {barrio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="password-mobile" className="text-white/90 text-sm mb-2 block">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password-mobile"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
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

                <div>
                  <Label htmlFor="confirmPassword-mobile" className="text-white/90 text-sm mb-2 block">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword-mobile"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="bg-white/95 backdrop-blur-sm border-0 h-14 text-base rounded-xl pr-12 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                      onClick={toggleConfirmPasswordVisibility}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
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
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-transparent text-white/70">o</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 rounded-xl"
                onClick={handleGoogleSignUp}
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
                Continuar con Google
              </Button>

              <div className="text-center pt-4 pb-4">
                <span className="text-white/80 text-sm">¿Ya tenés cuenta? </span>
                <Link href="/login" className="text-white font-semibold text-sm hover:underline">
                  Inicia sesión
                </Link>
              </div>
            </form>
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
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-center">
              Únete a la comunidad de VerdeScan
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nombre del usuario"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
              <Label htmlFor="neighborhood">Barrio</Label>
              <Select
                value={neighborhood}
                onValueChange={setNeighborhood}
                disabled={loading}
              >
                <SelectTrigger id="neighborhood">
                  <SelectValue placeholder="Selecciona tu barrio" />
                </SelectTrigger>
                <SelectContent>
                  {POSADAS_NEIGHBORHOODS.map((barrio) => (
                    <SelectItem key={barrio} value={barrio}>
                      {barrio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  minLength={6}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={toggleConfirmPasswordVisibility}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
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
              onClick={handleGoogleSignUp}
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
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
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
            El registro con Google estará disponible próximamente.
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