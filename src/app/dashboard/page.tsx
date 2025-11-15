"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import {
  Recycle,
  Gift,
  Users,
  CreditCard,
  ChevronRight,
  Package,
  Trash2,
  X,
  Scale,
  TrendingUp,
  UserCircle,
  User,
  FileText,
  Mail,
  LogOut,
  Phone,
  Link as LinkIcon,
  Droplet,
  Beer,
  Milk,
  Bus,
  Ticket,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default function DashboardPage() {
  const { userProfile, user, signOut } = useAuth()
  const [points, setPoints] = useState(0)
  const [packageCount, setPackageCount] = useState(0)
  const [rafflesCount, setRafflesCount] = useState(0)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showPersonalInfo, setShowPersonalInfo] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showRecycleOptions, setShowRecycleOptions] = useState(false)
  const [accumulatedWeight, setAccumulatedWeight] = useState(0)
  const [canCount, setCanCount] = useState(0)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<{
    code: string
    material_type: string
    points_value: number
    expires_at: string
    unit_description: string
    quantity?: number
  } | null>(null)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [virtualBin, setVirtualBin] = useState<{
    avu: number
    lata: number
    botella: number
  }>({
    avu: 0,
    lata: 0,
    botella: 0
  })

  // Estados para canje SUBE
  const [showSubeModal, setShowSubeModal] = useState(false)
  const [subeAlias, setSubeAlias] = useState('')
  const [canjeType, setCanjeType] = useState<'envases' | 'avu' | null>(null)
  const [canjeando, setCanjeando] = useState(false)
  const [canjeSuccess, setCanjeSuccess] = useState(false)
  const [canjeError, setCanjeError] = useState('')
  const [boletosCanjeados, setBoletosCanjeados] = useState(0)

  const router = useRouter()

  // Constantes de canje
  const PUNTOS_ENVASES = 10 // 10 puntos = 2 boletos
  const BOLETOS_ENVASES = 2
  const PUNTOS_AVU = 20 // 20 puntos = 4 boletos
  const BOLETOS_AVU = 4

  useEffect(() => {
    if (userProfile) {
      setPoints(userProfile.points)
    }
  }, [userProfile])

  // Cargar conteo de sorteos activos
  useEffect(() => {
    const fetchRafflesCount = async () => {
      try {
        const { count, error } = await supabase
          .from("raffles")
          .select("*", { count: 'exact', head: true })
          .eq("status", "active")

        if (error) {
          console.error("Error fetching raffles count:", error)
          return
        }

        setRafflesCount(count || 0)
      } catch (error) {
        console.error("Error fetching raffles count:", error)
      }
    }

    fetchRafflesCount()
  }, [])

  // Cargar tacho virtual
  useEffect(() => {
    const loadVirtualBin = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/user/virtual-bin', {
          credentials: 'include'
        })

        if (!response.ok) {
          // Si la tabla no existe aún, usar valores por defecto
          console.warn('Tacho virtual no disponible - usando valores por defecto')
          setVirtualBin({ avu: 0, lata: 0, botella: 0 })
          setPackageCount(0)
          return
        }

        const data = await response.json()

        if (data.success && data.materials) {
          setVirtualBin(data.materials)
          // Calcular total de envases
          const total = data.materials.avu + data.materials.lata + data.materials.botella
          setPackageCount(total)
        }
      } catch (error) {
        console.error('Error al cargar tacho virtual:', error)
        // Usar valores por defecto en caso de error
        setVirtualBin({ avu: 0, lata: 0, botella: 0 })
        setPackageCount(0)
      }
    }

    loadVirtualBin()
  }, [user])

  useEffect(() => {
    if (!user) return

    // Suscribirse a cambios en tiempo real de puntos
    const pointsChannel = supabase
      .channel("user-points")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.points !== undefined) {
            setPoints(payload.new.points as number)
          }
        }
      )
      .subscribe()

    // Suscribirse a cambios en tiempo real del tacho virtual
    const binChannel = supabase
      .channel("user-virtual-bin")
      .on(
        "postgres_changes",
        {
          event: "*", // Escuchar INSERT, UPDATE, DELETE
          schema: "public",
          table: "user_virtual_bin",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Recargar el tacho virtual cuando cambie
          try {
            const response = await fetch('/api/user/virtual-bin', {
              credentials: 'include'
            })
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.materials) {
                setVirtualBin(data.materials)
                const total = data.materials.avu + data.materials.lata + data.materials.botella
                setPackageCount(total)
              }
            }
          } catch (error) {
            console.error('Error recargando tacho virtual:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(pointsChannel)
      supabase.removeChannel(binChannel)
    }
  }, [user])

  // Cargar peso acumulado
  useEffect(() => {
    const loadAccumulatedWeight = () => {
      if (!user) return

      try {
        const savedWeight = localStorage.getItem(`accumulated_weight_${user.id}`)
        const savedCount = localStorage.getItem(`can_count_${user.id}`)

        if (savedWeight) {
          setAccumulatedWeight(parseFloat(savedWeight))
        }
        if (savedCount) {
          const count = parseInt(savedCount)
          setCanCount(count)
        }
      } catch (error) {
        console.error("Error loading accumulated weight:", error)
      }
    }

    loadAccumulatedWeight()
  }, [user])

  const handleScanClick = () => {
    // Mostrar el modal de bienvenida
    setShowWelcomeModal(true)
  }

  const handleCloseModal = () => {
    setShowWelcomeModal(false)
    // Redirigir a la página de escaneo
    router.push('/dashboard/scan')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Abrir modal de canje SUBE
  const handleOpenSubeCanje = (type: 'envases' | 'avu') => {
    setCanjeType(type)
    setShowSubeModal(true)
    setCanjeSuccess(false)
    setCanjeError('')
    setSubeAlias('')
  }

  // Procesar canje SUBE
  const handleCanjearSube = async () => {
    if (!user || !canjeType) return

    // Validar alias
    if (!subeAlias.trim()) {
      setCanjeError('Por favor ingresa el alias de tu tarjeta SUBE')
      return
    }

    setCanjeando(true)
    setCanjeError('')

    try {
      // Determinar puntos necesarios y boletos a entregar
      const puntosNecesarios = canjeType === 'envases' ? PUNTOS_ENVASES : PUNTOS_AVU
      const boletosAEntregar = canjeType === 'envases' ? BOLETOS_ENVASES : BOLETOS_AVU

      // Verificar que el usuario tenga suficientes puntos
      if (points < puntosNecesarios) {
        setCanjeError(`No tienes suficientes puntos. Necesitas ${puntosNecesarios} puntos.`)
        setCanjeando(false)
        return
      }

      // Descontar puntos del usuario
      const newPoints = points - puntosNecesarios
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({ points: newPoints })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Registrar el canje en una tabla de historial (opcional)
      // Aquí podrías guardar: user_id, tipo_canje, puntos_gastados, boletos, alias_sube, fecha

      // Actualizar puntos localmente
      setPoints(newPoints)

      // Mostrar éxito
      setBoletosCanjeados(boletosAEntregar)
      setCanjeSuccess(true)
    } catch (error) {
      console.error('Error al canjear:', error)
      setCanjeError('Hubo un error al procesar el canje. Por favor intenta de nuevo.')
    } finally {
      setCanjeando(false)
    }
  }

  // Calcular cuántos canjes puede hacer el usuario
  const canjesEnvasesDisponibles = Math.floor(points / PUNTOS_ENVASES)
  const canjesAvuDisponibles = Math.floor(points / PUNTOS_AVU)

  const handleGenerateToken = async (materialType: 'avu' | 'lata' | 'botella') => {
    // Verificar que hay materiales en el tacho
    const quantity = virtualBin[materialType]

    if (quantity === 0) {
      alert('No tienes este material en tu tacho para canjear')
      return
    }

    setGeneratingToken(true)
    setShowRecycleOptions(false)

    try {
      const response = await fetch('/api/tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          material_type: materialType,
          quantity: quantity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar token')
      }

      setGeneratedToken(data.token)
      setShowTokenModal(true)
    } catch (error) {
      console.error('Error al generar token:', error)
      alert(error instanceof Error ? error.message : 'Error al generar token')
    } finally {
      setGeneratingToken(false)
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

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'avu':
        return <Droplet className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-orange-600" />
      case 'lata':
        return <Beer className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-amber-700" />
      case 'botella':
        return <Milk className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-blue-600" />
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Saludo personalizado */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => setShowUserMenu(true)}
          className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-2 transition-all hover:from-green-200 hover:to-emerald-200 hover:shadow-md"
        >
          <UserCircle className="h-10 w-10 text-green-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Hola, {userProfile?.name?.split(' ')[0] || "Usuario"}
        </h1>
      </div>

      {/* Card principal unificada */}
      <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-6">
          {/* Puntos Disponibles */}
          <div className="flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-2xl bg-yellow-100 p-3">
                <Recycle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="mb-4 text-center">
              <div className="text-4xl font-bold text-gray-900">{points}</div>
              <p className="mt-1 text-sm font-medium text-gray-700">Puntos Disponibles</p>
            </div>
            <Button
              onClick={() => setShowRecycleOptions(true)}
              className="w-full rounded-full bg-lime-400 py-6 text-base font-semibold text-gray-900 shadow-sm hover:bg-lime-500"
            >
              CANJEAR
            </Button>
          </div>

          {/* Envases en tu Tacho */}
          <div className="flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-2xl bg-yellow-100 p-3">
                <Package className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="mb-4 text-center">
              <div className="text-4xl font-bold text-gray-900">{packageCount}</div>
              <p className="mt-1 text-sm font-medium text-gray-700">Envases en tu Tacho</p>
            </div>
            <Button
              onClick={handleScanClick}
              className="w-full rounded-full bg-lime-400 py-6 text-base font-semibold text-gray-900 shadow-sm hover:bg-lime-500"
            >
              ESCANEAR
            </Button>
          </div>
        </div>
      </div>

      {/* Sección Cargar SUBE */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Bus className="h-5 w-5 text-green-600" />
          Canjear Puntos por Boletos SUBE
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Canje Envases Ligeros */}
          <button
            onClick={() => handleOpenSubeCanje('envases')}
            disabled={points < PUNTOS_ENVASES}
            className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="rounded-full bg-blue-100 p-2">
                <Milk className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-900">Envases Ligeros</p>
                <p className="text-lg font-bold text-blue-600">{PUNTOS_ENVASES} pts</p>
                <p className="text-xs text-blue-700">= {BOLETOS_ENVASES} boletos</p>
              </div>
              {canjesEnvasesDisponibles > 0 && (
                <div className="text-xs text-green-600 font-semibold">
                  Puedes canjear {canjesEnvasesDisponibles}x
                </div>
              )}
            </div>
          </button>

          {/* Canje AVU */}
          <button
            onClick={() => handleOpenSubeCanje('avu')}
            disabled={points < PUNTOS_AVU}
            className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="rounded-full bg-amber-100 p-2">
                <Droplet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-900">AVU (1 Litro)</p>
                <p className="text-lg font-bold text-amber-600">{PUNTOS_AVU} pts</p>
                <p className="text-xs text-amber-700">= {BOLETOS_AVU} boletos</p>
              </div>
              {canjesAvuDisponibles > 0 && (
                <div className="text-xs text-green-600 font-semibold">
                  Puedes canjear {canjesAvuDisponibles}x
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Botón Progreso */}
      <button
        onClick={() => setShowProgressModal(true)}
        className="w-full rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-100 p-3">
              <Scale className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Progreso</span>
          </div>
          <ChevronRight className="h-6 w-6 text-gray-400" />
        </div>
      </button>

      {/* Sección Participa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Participa y Gana</h2>
          <ChevronRight className="h-5 w-5 text-yellow-500" />
        </div>

  

        {/* Sorteos */}
        <button
          onClick={() => router.push('/dashboard/raffles')}
          className="w-full rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-yellow-100 p-3">
                <Gift className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-left">
                <div className="text-base font-semibold text-gray-900">Sorteos</div>
                <div className="text-sm text-gray-500">
                  {rafflesCount === 0 ? 'No hay sorteos disponibles' : `${rafflesCount} ${rafflesCount === 1 ? 'sorteo disponible' : 'sorteos disponibles'}`}
                </div>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Modal de Bienvenida a VerdeScan */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            {/* Botón cerrar */}
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Icono de tacho amarillo */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-yellow-100 p-4">
                <Trash2 className="h-12 w-12 text-yellow-600" />
              </div>
            </div>

            {/* Título */}
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
              ¡Bienvenido a VerdeScan! 🌱
            </h2>

            {/* Mensaje */}
            <div className="mb-8 space-y-3 text-center text-gray-700">
              <p className="leading-relaxed">
                <strong>Escaneá tus primeras latas y tu aceite vegetal usado.</strong>
              </p>
              <p className="text-sm leading-relaxed">
                Cada vez que escaneás el código de barras, tus materiales se guardan en tu tacho virtual.
              </p>
              <p className="text-sm leading-relaxed">
                Cuando vayas al Ecopunto a reciclarlos, podrás <strong>vaciar el tacho</strong> y <strong>sumar puntos</strong> por tu aporte al planeta.
              </p>
            </div>

            {/* Botón Escanear */}
            <Button
              onClick={handleCloseModal}
              className="w-full rounded-full bg-yellow-400 py-6 text-lg font-semibold text-gray-900 shadow-sm hover:bg-yellow-500"
            >
              Escanear
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Progreso de Acumulación */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowProgressModal(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Contenido del progreso */}
            <div className="space-y-6">
              {/* Título */}
              <div className="flex items-center gap-3 border-b pb-4">
                <Scale className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Progreso de tu desafío</h2>
              </div>

              {/* Descripción */}
              <p className="text-sm text-gray-600">
                Acumula 1kg (1000g) para validar y ganar 50 puntos extras
              </p>

              {/* Barra de progreso */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-green-600">{accumulatedWeight}g / 1000g</span>
                  <span className="text-gray-500">{((accumulatedWeight / 1000) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.min((accumulatedWeight / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Estadísticas en grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Latas Escaneadas */}
                <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-gray-600">
                    <Package className="h-5 w-5" />
                    <span className="text-sm font-medium">Latas Escaneadas</span>
                  </div>
                  <p className="text-4xl font-bold text-blue-600">{canCount}</p>
                </div>

                {/* Tus Puntos */}
                <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-gray-600">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-medium">Tus Puntos</span>
                  </div>
                  <p className="text-4xl font-bold text-green-600">{points}</p>
                </div>
              </div>

              {/* Botón para ir a escanear */}
              <div className="pt-4">
                <Button
                  onClick={() => {
                    setShowProgressModal(false)
                    handleScanClick()
                  }}
                  className="w-full rounded-full bg-green-600 py-6 text-lg font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  <Scale className="mr-2 h-5 w-5" />
                  Ir a Escanear
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Página del Menú de Usuario */}
      {showUserMenu && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-green-50 to-white">
          <div className="mx-auto max-w-2xl">
            {/* Header con botón de volver */}
            <div className="flex items-center justify-between border-b bg-white px-4 py-4">
              <button
                onClick={() => setShowUserMenu(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Mi Cuenta</h1>
              <div className="w-10"></div> {/* Spacer para centrar el título */}
            </div>

            {/* Contenido de la página */}
            <div className="space-y-6 p-4 pt-6">
              {/* Avatar del usuario */}
              <div className="flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-4">
                  <UserCircle className="h-20 w-20 text-green-600" />
                </div>
              </div>

              {/* Opciones del menú */}
              <div className="space-y-3">
                {/* Información Personal */}
                <button
                  onClick={() => setShowPersonalInfo(true)}
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="rounded-2xl bg-blue-100 p-3">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-semibold text-gray-900">Información personal</p>
                    <p className="text-xs text-gray-500">Ver y editar tu perfil</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </button>

                {/* Términos y Condiciones */}
                <button
                  onClick={() => setShowTerms(true)}
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="rounded-2xl bg-purple-100 p-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-semibold text-gray-900">Términos y condiciones</p>
                    <p className="text-xs text-gray-500">Lee nuestros términos</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </button>

                {/* Contacto */}
                <button
                  onClick={() => setShowContact(true)}
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="rounded-2xl bg-green-100 p-3">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-semibold text-gray-900">Contacto</p>
                    <p className="text-xs text-gray-500">Envíanos un mensaje</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </button>

                {/* Cerrar Sesión */}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-red-200 bg-red-50 p-5 shadow-sm transition-all hover:bg-red-100 hover:shadow-md"
                >
                  <div className="rounded-2xl bg-red-200 p-3">
                    <LogOut className="h-6 w-6 text-red-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-semibold text-red-700">Cerrar sesión</p>
                    <p className="text-xs text-red-600">Salir de tu cuenta</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Página de Información Personal */}
      {showPersonalInfo && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-green-50 to-white">
          <div className="mx-auto max-w-2xl">
            {/* Header con botón de volver */}
            <div className="flex items-center justify-between border-b bg-white px-4 py-4">
              <button
                onClick={() => setShowPersonalInfo(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Información Personal</h1>
              <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Contenido de información personal */}
            <div className="space-y-4 p-4 pt-6">
              {/* Avatar */}
              <div className="flex justify-center pb-4">
                <div className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-4">
                  <UserCircle className="h-20 w-20 text-green-600" />
                </div>
              </div>

              {/* Datos personales */}
              <div className="space-y-3">
                {/* Nombre completo */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                  <p className="mb-1 text-xs font-medium text-gray-500">Nombre completo</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile?.name || "No especificado"}
                  </p>
                </div>

                {/* Email */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                  <p className="mb-1 text-xs font-medium text-gray-500">Email</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.email || "No especificado"}
                  </p>
                </div>

                {/* Barrio */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                  <p className="mb-1 text-xs font-medium text-gray-500">Barrio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile?.neighborhood || "No especificado"}
                  </p>
                </div>

                {/* Puntos totales ganados */}
                <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-sm">
                  <p className="mb-1 text-xs font-medium text-green-700">Puntos totales ganados</p>
                  <p className="text-3xl font-bold text-green-600">
                    {userProfile?.total_earned_points?.toLocaleString('es-AR') || 0}
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    ¡Sigue reciclando para ganar más puntos!
                  </p>
                </div>
              </div>

              

            </div>
          </div>
        </div>
      )}

      {/* Página de Contacto */}
      {showContact && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-green-50 to-white">
          <div className="mx-auto max-w-2xl">
            {/* Header con botón de volver */}
            <div className="flex items-center justify-between border-b bg-white px-4 py-4">
              <button
                onClick={() => setShowContact(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Contacto</h1>
              <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Contenido de contacto */}
            <div className="space-y-4 p-4 pt-6">
              {/* Título */}
              <div className="text-center pb-4">
                <h2 className="text-2xl font-bold text-gray-900">¿Necesitas ayuda?</h2>
                <p className="mt-2 text-sm text-gray-600">Contáctanos por cualquiera de estos medios</p>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-3">
                {/* WhatsApp */}
                <a
                  href="#"
                  
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="rounded-2xl bg-green-100 p-3">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-gray-500">WhatsApp</p>
                    <p className="text-lg font-semibold text-gray-900"></p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </a>

                {/* Email */}
                <a
                  href="mailto:delimajosiasgerman@gmail.com"
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="rounded-2xl bg-orange-100 p-3">
                    <Mail className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-base font-semibold text-gray-900">delimajosiasgerman@gmail.com</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </a>

                {/* LinkedIn */}
                <a
                  href="#"
                  
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-4 rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="rounded-2xl bg-blue-100 p-3">
                    <LinkIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-gray-500">Página web</p>
                    <p className="text-base font-semibold text-gray-900">LinkedIn</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </a>
              </div>

              {/* Mensaje adicional */}
              <div className="mt-6 rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-900">
                  Estamos aquí para ayudarte
                </p>
                <p className="mt-2 text-xs text-green-700">
                  Responderemos tu mensaje lo antes posible
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Página de Términos y Condiciones */}
      {showTerms && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-green-50 to-white">
          <div className="mx-auto max-w-2xl">
            {/* Header con botón de volver */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4">
              <button
                onClick={() => setShowTerms(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Términos y Condiciones</h1>
              <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Contenido de términos y condiciones */}
            <div className="space-y-6 p-4 pt-6 pb-8">
              {/* Título principal */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">TÉRMINOS Y CONDICIONES DE USO (T&C)</h2>
                <p className="mt-2 text-sm font-medium text-gray-600">Vigencia: 24 de Octubre de 2025</p>
              </div>

              {/* Introducción */}
              <div className="rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <p className="text-sm leading-relaxed text-gray-800">
                  Bienvenido/a a <strong>VerdeScan</strong>, una aplicación web progresiva (PWA) diseñada para incentivar
                  la economía circular mediante la recompensa por el correcto reciclaje de envases ligeros.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-800">
                  Al acceder y utilizar nuestra Plataforma, usted acepta y se obliga a cumplir los siguientes Términos y Condiciones.
                </p>
              </div>

              {/* Secciones */}
              <div className="space-y-5">
                {/* Sección 1 */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">1. Objeto del Servicio</h3>
                  <p className="mb-2 text-sm leading-relaxed text-gray-700">
                    El objeto de VerdeScan es registrar, validar y acreditar "Puntos Oficiales" a los Usuarios por la correcta entrega de los siguientes materiales:
                  </p>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
                    <li><strong>a) Envases Ligeros:</strong> Latas de aluminio y botellas de plástico de bebidas, validadas en Puntos de Recogida Asistidos (Kioscos/Ecopuntos Atendidos).</li>
                    <li><strong>b) Aceite Vegetal Usado (AVU):</strong> Entregado y validado en Puntos de Recogida Asistidos (Kioscos/Ecopuntos Atendidos).</li>
                  </ul>
                </div>

                {/* Sección 2 */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">2. Funcionamiento y Acreditación de Puntos</h3>
                  <p className="mb-3 text-sm leading-relaxed text-gray-700">
                    Cada vez que escaneás el código de barras, tus materiales se guardan en tu <strong>tacho virtual.</strong> Cuando vayas al Ecopunto a reciclarlos, podrás <strong>vaciar el tacho</strong> y <strong>sumar puntos</strong> por tu aporte al planeta.
                  </p>
                  <p className="mb-3 text-sm leading-relaxed text-gray-700">
                    La acreditación de <strong>bonos por sumar 1kg de aluminio</strong> se basa en un sistema de <strong>Gramaje Fijo</strong> en donde cada producto suma su peso, y no en el peso real individual en el momento de la entrega. Sigue escaneando hasta llegar a 1kg. Al llegar a 1kg, el sistema generara un Token Muestra este código al promotor y
                    ¡Recibirás tus 50 puntos automáticamente!
                    salvo indicación expresa de la Plataforma.
                  </p>

                  <h4 className="mb-2 mt-4 text-base font-semibold text-gray-900">2.1 Envases Ligeros (Latas/Plástico - Puntos Asistidos)</h4>
                  <p className="mb-2 text-sm text-gray-700">El proceso de acreditación de latas es un proceso en dos fases:</p>

                  <div className="ml-3 space-y-3">
                    <div>
                      <p className="mb-1 text-sm font-semibold text-blue-700">A. Fase de Preparación (Registro Offline):</p>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
                        <li>El Usuario puede escanear el código de barras (GTIN) de los envases desde su hogar, sin necesidad de conexión a internet.</li>
                        <li>El escaneo del GTIN registra la intención de reciclar, asignando un Peso Fijo de material (en gramos) basado en la base de datos central.</li>
                        <li><strong className="text-red-600">IMPORTANTE:</strong> Este registro es un registro pendiente y no constituye una acreditación de puntos.
                        Los puntos se mantienen reservados hasta la validación física.</li>
                        <li><strong>Puntuación:</strong> Por cada envase validado en el Punto de Recogida Asistido, el Usuario acumulará 1 Punto Oficial.</li>

                      </ul>
                    </div>

                    <div>
                      <p className="mb-1 text-sm font-semibold text-green-700">B. Fase de Validación (Acreditación Asistida - Token Único):</p>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
                        <li>El Usuario debe dirigirse a un Punto de Recogida Asistido (Kiosco/Ecopunto con personal).</li>
                        <li>El Usuario toca 'Canjear Puntos' en la app, lo cual genera un Token Único (OTC) en su aplicación, válido por 15 minutos.</li>
                        <li><strong>Prueba de Depósito (Doble Validación):</strong> Tras la entrega física de los envases, el Kiosquero/Personal Asistente debe ingresar el Token Único (OTC) en su propia interfaz de la Plataforma para validar la entrega.</li>
                        <li><strong>Acreditación:</strong> Los puntos reservados se acreditan en la cuenta del Usuario únicamente si el Kiosquero confirma la recepción física mediante la validación del Token Único.</li>
                      </ul>
                    </div>
                  </div>

                  <h4 className="mb-2 mt-4 text-base font-semibold text-gray-900">2.2 Aceite Vegetal Usado (AVU - Puntos Asistidos)</h4>
                  <p className="mb-2 text-sm text-gray-700">El proceso de acreditación de AVU requiere una doble validación mediante Token Único (OTC):</p>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
                    <li><strong>Unidad de Entrega y Acopio:</strong> La entrega mínima y estándar es de 1 Litro (acreditado como 1 Litro de AVU, a efectos de puntuación). Los Puntos de Recogida Asistidos (Kioscos) facilitarán al Usuario envases de 1 Litro vacíos para el acopio inicial. Estos envases son retornables y deben ser intercambiados en cada nueva entrega para mantener la trazabilidad del sistema.</li>
                    <li><strong>Puntuación:</strong> Por la validación de cada Litro de AVU entregado, el Usuario acumulará 20 Puntos Oficiales.</li>
                    <li><strong>Generación de Token:</strong> El Usuario toca 'Canjear Puntos' en la app, lo cual genera un Token Único (OTC) en su aplicación.</li>
                    <li><strong>Prueba de Depósito (Doble Validación):</strong> Tras la entrega física del envase de AVU, el Kiosquero/Personal Asistente debe ingresar el Token Único (OTC) en su propia interfaz de la Plataforma para validar la entrega.</li>
                    <li><strong>Acreditación:</strong> Los puntos solo se acreditan en la cuenta del Usuario cuando el Kiosquero acepta y confirma la recepción física mediante la validación del Token Único.</li>
                  </ul>

                  <h4 className="mb-2 mt-4 text-base font-semibold text-gray-900">2.3 Canje de Puntos y Recompensas (Tarjeta SUBE y Sorteos)</h4>
                  <p className="mb-2 text-sm text-gray-700">Los Puntos Oficiales acumulados podrán ser canjeados por recompensas definidas por la Plataforma, con las siguientes equivalencias:</p>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
                    <li><strong>a) Canje SUBE - Envases Ligeros:</strong> La acumulación de 10 Puntos Oficiales (equivalentes a 10 envases validados) permite canjear un valor equivalente a dos (2) boletos en la tarjeta SUBE.</li>
                    <li><strong>b) Canje SUBE - AVU:</strong> La acumulación de 20 Puntos Oficiales (equivalentes a 1 Litro de AVU validado) permite canjear un valor equivalente a cuatro (4) boletos en la tarjeta SUBE.</li>
                    <li><strong>c) Boletos para Sorteos:</strong> Los Usuarios podrán canjear sus Puntos Oficiales por boletos para participar en sorteos organizados por la Plataforma. Cada boleto de sorteo tiene un costo de 5 Puntos Oficiales.</li>
                  </ul>
                  <p className="mt-2 text-xs italic text-gray-600">
                    <strong>IMPORTANTE:</strong> El canje de puntos está sujeto a la disponibilidad de los Puntos de Recogida para aplicar la carga en la tarjeta SUBE y a la validación de los límites de canje establecidos por la Plataforma. Las reglas, premios y fechas de los sorteos se detallarán en una sección separada de la Plataforma.
                  </p>
                </div>

                {/* Sección 3 */}
                <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-5">
                  <h3 className="mb-3 text-lg font-bold text-red-900">3. Disposiciones Anti-Fraude</h3>
                  <p className="mb-3 text-sm leading-relaxed text-red-800">
                    El objetivo principal de los mecanismos de validación es prevenir el fraude y garantizar que solo se recompensen los residuos efectivamente reciclados.
                  </p>
                  <ul className="ml-4 list-disc space-y-2 text-sm text-red-800">
                    <li><strong>a) Fraude en Envases Ligeros:</strong> Se considera fraude el escaneo de GTINs seguido de la validación por Token Único sin el depósito efectivo de los envases.
                    La Plataforma impondrá límites máximos diarios o semanales de acreditación para mitigar este riesgo.</li>
                    <li><strong>b) Fraude en AVU:</strong> El intento de obtener un Token Único sin entregar físicamente el litro de aceite vegetal al Kiosquero será detectado y sancionado.
                    La negativa o anulación de la validación del Token por parte del Kiosquero resultará en la no acreditación de los puntos.</li>
                    <li><strong>c) Sanciones:</strong> La detección de cualquier actividad fraudulenta, incluyendo la manipulación de la señal o el uso de códigos no autorizados,
                    resultará en la anulación de todos los puntos acumulados y la suspensión temporal o permanente de la cuenta del Usuario.</li>
                  </ul>
                </div>

                {/* Sección 4 */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">4. Uso de Datos Personales</h3>
                  <ul className="ml-4 list-disc space-y-2 text-sm text-gray-700">
                    <li><strong>a) Datos de Escaneo:</strong> Los datos de escaneo (GTIN, hora, ID del Contenedor, peso de las latas de aluminio) se utilizarán para generar estadísticas de reciclaje y optimizar la logística.
                    Estos datos se anonimizarán o se tratarán de forma agregada para informes públicos.</li>
                  </ul>
                </div>

                {/* Sección 5 */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">5. Limitación de Responsabilidad</h3>
                  <p className="mb-2 text-sm leading-relaxed text-gray-700">VerdeScan actúa como una herramienta de registro y facilitación.</p>
                  <ul className="ml-4 list-disc space-y-2 text-sm text-gray-700">
                    <li><strong>a) Materiales:</strong> VerdeScan no se hace responsable por el estado, la contaminación o la calidad de los materiales entregados (AVU contaminado, latas con restos, etc.).</li>
                    <li><strong>b) Disponibilidad:</strong> La disponibilidad de Puntos de Recogida, Contenedores, Kioscos y las recompensas está sujeta a la disponibilidad de infraestructura y acuerdos con terceros.</li>
                    <li><strong>c) Fallo de Conexión:</strong> La Plataforma no garantiza la acreditación inmediata de puntos en caso de fallo de conexión a internet en el Ecopunto o Kiosco.
                    Las transacciones fallidas serán marcadas como pendientes de resolución.</li>
                  </ul>
                </div>

                {/* Sección 6 */}
                <div className="rounded-3xl border-2 border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">6. Modificaciones de los T&C</h3>
                  <p className="text-sm leading-relaxed text-gray-700">
                   Términos y Condiciones de Uso – VerdeScan Copray
1. Uso Comercial y Licencias
Queda prohibida la venta, distribución o explotación comercial de este software sin autorización expresa del propietario del sistema.

Los usuarios que deseen utilizar el software con fines comerciales deberán contactarse previamente con el propietario para adquirir una licencia válida.

El incumplimiento de esta disposición constituye una violación a los derechos de autor y dará lugar a acciones legales correspondientes.

2. Propiedad Intelectual
Los derechos del código pertenecen a los estudiantes que lo desarrollaron.

Ningún usuario podrá copiar, modificar ni reproducir el software sin contar con una licencia otorgada por el propietario.

3. Modificación de los Términos
VerdeScan se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.

Las modificaciones entrarán en vigor a partir de su publicación en la Plataforma.
                  </p>
                </div>
              </div>

              {/* Aceptación */}
              <div className="rounded-3xl border-2 border-green-300 bg-gradient-to-br from-green-100 to-emerald-100 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <p className="text-base font-bold text-green-900">
                  He leído y acepto los Términos y Condiciones del Servicio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Opciones de Reciclaje */}
      {showRecycleOptions && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-green-50 to-white">
          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-white px-4 py-4">
              <button
                onClick={() => setShowRecycleOptions(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Reciclar</h1>
              <div className="w-10"></div>
            </div>

            {/* Opciones de reciclaje */}
            <div className="space-y-3 p-4 pt-6 pb-6">
              {/* Aceite Vegetal Usado (AVU) */}
              <button
                onClick={() => handleGenerateToken('avu')}
                disabled={generatingToken}
                className={`flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-orange-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-orange-300 disabled:opacity-50 ${
                  virtualBin.avu > 0 ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div className="rounded-full bg-orange-100 p-4">
                  <Droplet className="h-12 w-12 text-orange-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Aceite Vegetal Usado</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {virtualBin.avu > 0
                      ? `${virtualBin.avu} en tu tacho - 20 puntos por litro`
                      : '20 puntos por litro'
                    }
                  </p>
                </div>
              </button>

              {/* Lata de Aluminio */}
              <button
                onClick={() => handleGenerateToken('lata')}
                disabled={generatingToken}
                className={`flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-amber-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300 disabled:opacity-50 ${
                  virtualBin.lata > 0 ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div className="rounded-full bg-amber-100 p-4">
                  <Beer className="h-12 w-12 text-amber-700" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Lata de Aluminio</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {virtualBin.lata > 0
                      ? `${virtualBin.lata} en tu tacho - 1 punto por lata`
                      : '1 punto por lata'
                    }
                  </p>
                </div>
              </button>

              {/* Botella de Plástico */}
              <button
                onClick={() => handleGenerateToken('botella')}
                disabled={generatingToken}
                className={`flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-blue-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-300 disabled:opacity-50 ${
                  virtualBin.botella > 0 ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <div className="rounded-full bg-blue-100 p-4">
                  <Milk className="h-12 w-12 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Botella de Plástico</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {virtualBin.botella > 0
                      ? `${virtualBin.botella} en tu tacho - 1 punto por botella`
                      : '1 punto por botella'
                    }
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Token Generado */}
      {showTokenModal && generatedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-4 sm:p-6 md:p-8 shadow-2xl max-h-[95vh] overflow-y-auto">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowTokenModal(false)}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 z-10"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Icono del material */}
            <div className="mb-4 sm:mb-6 flex justify-center pt-2">
              <div className="rounded-2xl bg-green-100 p-3 sm:p-4">
                {getMaterialIcon(generatedToken.material_type)}
              </div>
            </div>

            {/* Título */}
            <h2 className="mb-1 sm:mb-2 text-center text-xl sm:text-2xl font-bold text-gray-900">
              Token Generado
            </h2>
            <p className="mb-4 sm:mb-6 text-center text-xs sm:text-sm text-gray-600">
              {getMaterialName(generatedToken.material_type)}
            </p>

            {/* Token Code - Grande y destacado con tamaño responsivo */}
            <div className="mb-4 sm:mb-6 rounded-2xl border-3 sm:border-4 border-green-500 bg-green-50 p-4 sm:p-6">
              <p className="mb-2 text-center text-xs sm:text-sm font-medium text-gray-600">
                Muestra este código al promotor:
              </p>
              <p className="text-center text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-green-600 break-all">
                {generatedToken.code}
              </p>
            </div>

            {/* Información adicional */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 sm:p-3">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Material</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right ml-2">
                  {generatedToken.unit_description}
                </span>
              </div>

              {generatedToken.quantity && generatedToken.quantity > 1 && (
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-2.5 sm:p-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Cantidad</span>
                  <span className="text-xs sm:text-sm font-bold text-blue-600">
                    {generatedToken.quantity} unidades
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 sm:p-3">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Puntos a ganar</span>
                <span className="text-xs sm:text-sm font-bold text-green-600">
                  +{generatedToken.points_value} puntos
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-2.5 sm:p-3">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Válido hasta</span>
                <span className="text-xs sm:text-sm font-semibold text-yellow-700">
                  {new Date(generatedToken.expires_at).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="mb-4 sm:mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-900 font-semibold">
                Instrucciones:
              </p>
              <ol className="mt-2 list-decimal pl-4 sm:pl-5 text-xs sm:text-sm text-blue-800 space-y-1">
                <li>Dirígete al kiosco o ecopunto más cercano</li>
                <li>Entrega tu material reciclable</li>
                <li>Muestra este código al promotor</li>
                <li>¡Recibirás tus puntos automáticamente!</li>
              </ol>
            </div>

            {/* Botón Cerrar */}
            <Button
              onClick={() => setShowTokenModal(false)}
              className="w-full rounded-full bg-green-600 py-4 sm:py-5 md:py-6 text-base sm:text-lg font-semibold text-white shadow-sm hover:bg-green-700"
            >
              Entendido
            </Button>

            {/* Advertencia de expiración */}
            <p className="mt-3 sm:mt-4 text-center text-xs text-gray-500">
              Este código expira en 15 minutos
            </p>
          </div>
        </div>
      )}

      {/* Modal de Canje SUBE */}
      {showSubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowSubeModal(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {!canjeSuccess ? (
              <>
                {/* Título */}
                <div className="mb-6 flex justify-center">
                  <div className={`rounded-2xl p-4 ${
                    canjeType === 'envases' ? 'bg-blue-100' : 'bg-amber-100'
                  }`}>
                    <Bus className={`h-12 w-12 ${
                      canjeType === 'envases' ? 'text-blue-600' : 'text-amber-600'
                    }`} />
                  </div>
                </div>

                <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
                  Canjear por Boletos SUBE
                </h2>
                <p className="mb-6 text-center text-sm text-gray-600">
                  {canjeType === 'envases'
                    ? `${PUNTOS_ENVASES} puntos = ${BOLETOS_ENVASES} boletos SUBE`
                    : `${PUNTOS_AVU} puntos = ${BOLETOS_AVU} boletos SUBE`
                  }
                </p>

                {/* Información del canje */}
                <div className="mb-6 space-y-3">
                  <div className="rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Tus puntos actuales</span>
                      <span className="text-2xl font-bold text-gray-900">{points}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Puntos a descontar</span>
                      <span className="text-xl font-bold text-red-600">
                        -{canjeType === 'envases' ? PUNTOS_ENVASES : PUNTOS_AVU}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Puntos restantes</span>
                      <span className="text-2xl font-bold text-green-600">
                        {points - (canjeType === 'envases' ? PUNTOS_ENVASES : PUNTOS_AVU)}
                      </span>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 ${
                    canjeType === 'envases'
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200'
                      : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200'
                  }`}>
                    <div className="flex items-center justify-center gap-2">
                      <Ticket className={canjeType === 'envases' ? 'h-5 w-5 text-blue-600' : 'h-5 w-5 text-amber-600'} />
                      <span className={`text-lg font-bold ${
                        canjeType === 'envases' ? 'text-blue-900' : 'text-amber-900'
                      }`}>
                        Recibirás {canjeType === 'envases' ? BOLETOS_ENVASES : BOLETOS_AVU} boletos SUBE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input de Alias SUBE */}
                <div className="mb-6">
                  <label htmlFor="subeAlias" className="mb-2 block text-sm font-semibold text-gray-700">
                    Alias de tu tarjeta SUBE
                  </label>
                  <input
                    id="subeAlias"
                    type="text"
                    value={subeAlias}
                    onChange={(e) => setSubeAlias(e.target.value)}
                    placeholder="Ej: JUAN.PEREZ"
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-center text-lg font-mono uppercase focus:border-green-500 focus:outline-none"
                    maxLength={20}
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Ingresa el alias de tu tarjeta SUBE para recibir los boletos
                  </p>
                </div>

                {/* Mensaje de error */}
                {canjeError && (
                  <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-200 p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{canjeError}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowSubeModal(false)}
                    variant="outline"
                    className="flex-1 rounded-full py-5 text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCanjearSube}
                    disabled={canjeando || !subeAlias.trim()}
                    className={`flex-1 rounded-full py-5 text-base text-white ${
                      canjeType === 'envases'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {canjeando ? 'Procesando...' : 'Canjear Ahora'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Modal de éxito */}
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-4 shadow-lg">
                    <CheckCircle2 className="h-16 w-16 text-white" />
                  </div>
                </div>

                <h2 className="mb-3 text-center text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ¡Felicidades, {userProfile?.name}!
                </h2>

                <p className="mb-6 text-center text-base text-gray-700">
                  Se acreditaron exitosamente
                </p>

                <div className="mb-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Bus className="h-10 w-10 text-green-600" />
                    <span className="text-5xl font-bold text-green-600">{boletosCanjeados}</span>
                  </div>
                  <p className="text-center text-lg font-semibold text-green-900">
                    {boletosCanjeados === 1 ? 'Boleto SUBE' : 'Boletos SUBE'}
                  </p>
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Alias: <span className="font-mono font-semibold">{subeAlias}</span>
                  </p>
                </div>

                <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-900 text-center">
                    Los boletos se acreditarán en tu tarjeta SUBE en las próximas 24-48 horas hábiles
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setShowSubeModal(false)
                    setCanjeSuccess(false)
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-5 text-lg font-semibold text-white"
                >
                  ¡Entendido!
                </Button>

                <p className="mt-4 text-center text-xs text-gray-500">
                  Tus puntos restantes: <span className="font-bold text-gray-700">{points} puntos</span>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
