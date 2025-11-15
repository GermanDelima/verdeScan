"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Store,
  LogOut,
  Loader2,
  UserCircle,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Hash,
  Droplet,
  Beer,
  Milk,
  Phone,
  TrendingUp
} from "lucide-react"

type StaffSession = {
  id: string
  username: string
  account_type: 'promotor' | 'ecopunto'
  loginTime: string
}

type ValidationResult = {
  success: boolean
  message: string
  validation?: {
    user_name: string
    user_email: string
    material_type: string
    points_credited: number
    previous_points: number
    new_points: number
    validated_by: string
    validated_at: string
  }
}

export default function PromotorDashboardPage() {
  const [session, setSession] = useState<StaffSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [tokenCode, setTokenCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  // Estados para el progreso del tanque y contadores
  const [avuLiters, setAvuLiters] = useState(0)
  const [canCount, setCanCount] = useState(0)
  const [bottleCount, setBottleCount] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  const router = useRouter()
  const TANK_CAPACITY = 200 // Capacidad del tanque en litros

  useEffect(() => {
    // Verificar si hay sesión activa
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem('staff_session')

        if (!sessionData) {
          router.push('/promotor/login')
          return
        }

        const parsedSession = JSON.parse(sessionData) as StaffSession
        setSession(parsedSession)
      } catch (err) {
        console.error('Error al verificar sesión:', err)
        router.push('/promotor/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  // Función para cargar estadísticas
  const loadStats = async () => {
    if (!session) return

    try {
      setLoadingStats(true)

      // Obtener todas las validaciones del promotor usando la API de tokens
      const response = await fetch(`/api/tokens/stats?staff_id=${session.id}`)

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const data = await response.json()

      console.log('Estadísticas cargadas:', data) // Debug

      setAvuLiters(data.avu_liters || 0)
      setCanCount(data.can_count || 0)
      setBottleCount(data.bottle_count || 0)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Cargar estadísticas al inicio
  useEffect(() => {
    loadStats()
  }, [session])

  // Recargar estadísticas después de cada validación exitosa
  useEffect(() => {
    if (validationResult?.success && session) {
      console.log('Validación exitosa, recargando estadísticas...') // Debug
      // Recargar desde el servidor para asegurar datos correctos
      loadStats()
    }
  }, [validationResult?.success])

  const handleSignOut = () => {
    localStorage.removeItem('staff_session')
    router.push('/promotor/login')
  }

  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) return
    if (!tokenCode.trim()) {
      setValidationResult({
        success: false,
        message: 'Por favor ingresa un código de token'
      })
      return
    }

    setValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/tokens/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_code: tokenCode.toUpperCase().trim(),
          staff_id: session.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResult({
          success: true,
          message: data.message,
          validation: data.validation
        })
        setTokenCode('') // Limpiar el campo
      } else {
        setValidationResult({
          success: false,
          message: data.error || 'Error al validar el token'
        })
      }
    } catch (error) {
      console.error('Error al validar token:', error)
      setValidationResult({
        success: false,
        message: 'Error de conexión. Intenta nuevamente.'
      })
    } finally {
      setValidating(false)
    }
  }

  const getMaterialName = (type: string) => {
    switch (type) {
      case 'avu':
        return 'Aceite Vegetal Usado'
      case 'lata':
        return 'Lata de Aluminio'
      case 'botella':
        return 'Botella de Plástico'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isPromotor = session.account_type === 'promotor'
  const accountTypeLabel = isPromotor ? 'Promotor / Kioskero' : 'Ecopunto'
  const accountTypeIcon = isPromotor ? Users : Store
  const accountTypeColor = isPromotor ? 'blue' : 'purple'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full bg-${accountTypeColor}-100 p-3`}>
              {isPromotor ? (
                <Users className={`h-8 w-8 text-${accountTypeColor}-600`} />
              ) : (
                <Store className={`h-8 w-8 text-${accountTypeColor}-600`} />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de {accountTypeLabel}</h1>
              <p className="text-sm text-gray-600">Bienvenido, {session.username}</p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Validador de Tokens */}
        <Card className="shadow-xl border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Hash className="h-6 w-6 text-green-600" />
              Validar Token de Reciclaje
            </CardTitle>
            <CardDescription>
              Ingresa el código que te muestra el usuario para acreditar sus puntos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleValidateToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenCode" className="text-base font-semibold">
                  Código del Token
                </Label>
                <Input
                  id="tokenCode"
                  type="text"
                  placeholder="Ej: ABC123"
                  value={tokenCode}
                  onChange={(e) => setTokenCode(e.target.value.toUpperCase())}
                  disabled={validating}
                  className="text-2xl font-mono text-center tracking-wider h-16 text-gray-900 border-2 focus:border-green-500"
                  maxLength={6}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 text-center">
                  Ingresa el código de 6 caracteres que muestra el usuario
                </p>
              </div>

              <Button
                type="submit"
                disabled={validating || !tokenCode.trim()}
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Validar y Acreditar Puntos
                  </>
                )}
              </Button>
            </form>

            {/* Resultado de Validación */}
            {validationResult && (
              <div className={`mt-6 rounded-lg border-2 p-4 ${
                validationResult.success
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start gap-3">
                  {validationResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      validationResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {validationResult.message}
                    </p>

                    {validationResult.success && validationResult.validation && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-lg bg-white p-3 border border-green-200">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Usuario:</p>
                              <p className="font-semibold text-gray-900">
                                {validationResult.validation.user_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Material:</p>
                              <p className="font-semibold text-gray-900">
                                {getMaterialName(validationResult.validation.material_type)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-green-100 p-3 border border-green-300">
                          <p className="text-sm text-gray-600 mb-1">Puntos Acreditados</p>
                          <p className="text-3xl font-bold text-green-600">
                            +{validationResult.validation.points_credited} puntos
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Total del usuario: {validationResult.validation.new_points} puntos
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progreso del Tanque de AVU y Contadores */}
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          {/* Tanque de AVU */}
          <Card className="shadow-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplet className="h-6 w-6 text-amber-600" />
                  <span className="text-amber-900">Tanque de AVU (Aceite Vegetal Usado)</span>
                </div>
                <span className="text-2xl font-bold text-amber-700">
                  {loadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${avuLiters}L / ${TANK_CAPACITY}L`
                  )}
                </span>
              </CardTitle>
              <CardDescription className="text-amber-700">
                Progreso del tanque de 200 litros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barra de Progreso */}
              <div className="relative">
                <div className="h-8 w-full rounded-full bg-amber-200 overflow-hidden border-2 border-amber-300">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500 ease-out flex items-center justify-center"
                    style={{ width: `${Math.min((avuLiters / TANK_CAPACITY) * 100, 100)}%` }}
                  >
                    {avuLiters > 0 && (
                      <span className="text-xs font-bold text-white drop-shadow">
                        {((avuLiters / TANK_CAPACITY) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del Tanque */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3 border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Litros Acumulados</p>
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-amber-600" />
                    <p className="text-2xl font-bold text-amber-900">{avuLiters}L</p>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Falta para Llenar</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <p className="text-2xl font-bold text-amber-900">
                      {Math.max(TANK_CAPACITY - avuLiters, 0)}L
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerta cuando está lleno o cerca de llenarse */}
              {avuLiters >= TANK_CAPACITY && (
                <div className="rounded-lg bg-green-100 border-2 border-green-400 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-green-900">¡Tanque Lleno!</p>
                      <p className="text-sm text-green-700 mt-1">
                        El tanque ha alcanzado su capacidad máxima de {TANK_CAPACITY} litros.
                      </p>
                      <Button
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar para Recolección
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {avuLiters >= TANK_CAPACITY * 0.8 && avuLiters < TANK_CAPACITY && (
                <div className="rounded-lg bg-yellow-100 border-2 border-yellow-400 p-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">
                        Tanque al {((avuLiters / TANK_CAPACITY) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-yellow-700">
                        Considera coordinar la recolección pronto
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contador de Latas */}
          <Card className="shadow-lg border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Beer className="h-5 w-5 text-blue-600" />
                <span>Latas Escaneadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-3">
                  <Beer className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-blue-900 mb-1">{canCount}</p>
                <p className="text-sm text-blue-600">Latas de Aluminio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contador de Botellas */}
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <Card className="shadow-lg border-2 border-cyan-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Milk className="h-5 w-5 text-cyan-600" />
                <span>Botellas Escaneadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 mb-3">
                  <Milk className="h-10 w-10 text-cyan-600" />
                </div>
                <p className="text-4xl font-bold text-cyan-900 mb-1">{bottleCount}</p>
                <p className="text-sm text-cyan-600">Botellas de Plástico</p>
              </div>
            </CardContent>
          </Card>

          {/* Resumen Total */}
          <Card className="shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                Resumen de Reciclaje
              </CardTitle>
              <CardDescription className="text-purple-700">
                Total de materiales validados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="rounded-lg bg-white p-3 border border-purple-200">
                    <Droplet className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-900">{avuLiters}L</p>
                    <p className="text-xs text-gray-600">AVU</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="rounded-lg bg-white p-3 border border-purple-200">
                    <Beer className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{canCount}</p>
                    <p className="text-xs text-gray-600">Latas</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="rounded-lg bg-white p-3 border border-purple-200">
                    <Milk className="h-6 w-6 text-cyan-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-cyan-900">{bottleCount}</p>
                    <p className="text-xs text-gray-600">Botellas</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-white p-3 border border-purple-200">
                <p className="text-sm text-gray-600 text-center">
                  Total de validaciones: <span className="font-bold text-purple-900">{avuLiters + canCount + bottleCount}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Información */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Información de la Sesión */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm font-medium text-gray-600">Usuario</span>
                <span className="text-sm font-semibold text-gray-900">{session.username}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm font-medium text-gray-600">Tipo</span>
                <div className="flex items-center gap-2">
                  {isPromotor ? (
                    <>
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-600">Promotor</span>
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-600">Ecopunto</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm font-medium text-gray-600">Último Acceso</span>
                <span className="text-xs text-gray-500">
                  {new Date(session.loginTime).toLocaleString('es-AR', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones */}
          <Card className="shadow-lg border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="h-5 w-5" />
                Cómo Validar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-blue-900">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>El usuario te muestra su código de 6 dígitos</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Verifica que entregó el material correctamente</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Ingresa el código en el campo de arriba</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>¡Los puntos se acreditan automáticamente!</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
