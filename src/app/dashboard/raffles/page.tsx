// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { supabase } from "@/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import {
  Trophy,
  Coins,
  Ticket,
  Calendar,
  CheckCircle,
  AlertCircle,
  Gift,
  Store,
  Pizza,
  IceCream,
  Book,
  Film,
  Leaf,
  Sprout,
  Percent,
  Sparkles
} from "lucide-react"

interface Raffle {
  id: string
  title: string
  description: string
  prize: string
  ticket_cost: number
  draw_date: string
  status: string
  category?: 'eco' | 'commerce' | 'discount'
  sponsor?: string
  image_url?: string
}

interface MyParticipation {
  raffle: Raffle
  ticketCount: number
}

export default function RafflesPage() {
  const { user, userProfile, refreshProfile } = useAuth()
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [myParticipations, setMyParticipations] = useState<MyParticipation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [ticketNumbers, setTicketNumbers] = useState<string[]>([])
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)
  const [ticketQuantity, setTicketQuantity] = useState(1)
  const [error, setError] = useState("")

  // Obtener puntos del usuario desde el perfil
  const userPoints = userProfile?.points || 0

  useEffect(() => {
    fetchRaffles()
    if (user) {
      fetchMyParticipations()
    }
  }, [user])

  const fetchRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from("raffles")
        .select("*")
        .eq("status", "active")
        .order("draw_date", { ascending: true })

      if (error) {
        console.error("Error fetching raffles:", error)
        setError("Error al cargar los sorteos. Por favor recarga la página.")
        setRaffles([])
        return
      }

      setRaffles(data || [])
    } catch (error) {
      console.error("Error fetching raffles:", error)
      setError("Error de conexión con la base de datos.")
      setRaffles([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMyParticipations = async () => {
    if (!user) return

    try {
      // Obtener los sorteos en los que participo con el conteo de boletos
      const { data, error } = await supabase
        .from("raffle_tickets")
        .select("raffle_id, raffles(*)")
        .eq("user_id", user.id)

      if (error) {
        console.error("Error fetching participations:", error)
        return
      }

      if (!data || data.length === 0) {
        setMyParticipations([])
        return
      }

      // Agrupar por sorteo y contar boletos
      const participationsMap = new Map<string, { raffle: Raffle; ticketCount: number }>()

      data.forEach((ticket: any) => {
        if (ticket.raffles && ticket.raffles.status === 'active') {
          const raffleId = ticket.raffle_id
          if (participationsMap.has(raffleId)) {
            participationsMap.get(raffleId)!.ticketCount++
          } else {
            participationsMap.set(raffleId, {
              raffle: ticket.raffles as Raffle,
              ticketCount: 1
            })
          }
        }
      })

      setMyParticipations(Array.from(participationsMap.values()))
    } catch (error) {
      console.error("Error fetching participations:", error)
    }
  }


  const generateTicketNumber = () => {
    const num = Math.floor(Math.random() * 1000000)
    return num.toString().padStart(6, '0')
  }

  const handleBuyTickets = async (raffle: Raffle, quantity: number) => {
    setError("")

    // Validar que el usuario esté autenticado
    if (!user || !userProfile) {
      setError("Debes iniciar sesión para comprar boletos")
      return
    }

    setSelectedRaffle(raffle)

    const totalCost = raffle.ticket_cost * quantity

    if (userPoints < totalCost) {
      setError(`No tienes suficientes puntos. Necesitas ${totalCost} puntos para comprar ${quantity} boleto(s)`)
      return
    }

    if (quantity < 1) {
      setError("Debes comprar al menos 1 boleto")
      return
    }

    try {
      // Descontar puntos disponibles del usuario (NO afecta total_earned_points usado en ranking)
      const newPoints = userPoints - totalCost
      const { error: updateError } = await supabase
        .from("users")
        .update({ points: newPoints } as any)
        .eq("id", user.id)

      if (updateError) throw updateError

      // Generar números de boletos
      const tickets: string[] = []
      const ticketInserts = []

      for (let i = 0; i < quantity; i++) {
        const ticketNumber = generateTicketNumber()
        tickets.push(ticketNumber)
        ticketInserts.push({
          user_id: user.id,
          raffle_id: raffle.id,
          ticket_number: ticketNumber
        })
      }

      // Guardar todos los boletos en la base de datos
      const { error: ticketError } = await supabase
        .from("raffle_tickets")
        .insert(ticketInserts as any)

      if (ticketError) throw ticketError

      // Refrescar el perfil del usuario para actualizar los puntos
      await refreshProfile()

      // Refrescar las participaciones
      await fetchMyParticipations()

      setTicketNumbers(tickets)
      setShowModal(true)
      setTicketQuantity(1)
    } catch (error) {
      console.error("Error buying tickets:", error)
      setError("Hubo un error al comprar los boletos. Por favor intenta de nuevo.")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilDraw = (dateString: string) => {
    const now = new Date()
    const drawDate = new Date(dateString)
    const diff = drawDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'eco':
        return <Leaf className="h-6 w-6" />
      case 'discount':
        return <Percent className="h-6 w-6" />
      case 'commerce':
        return <Store className="h-6 w-6" />
      default:
        return <Gift className="h-6 w-6" />
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'eco':
        return {
          bg: 'from-green-500/20 to-emerald-500/20',
          badge: 'bg-green-100 text-green-700 border-green-200',
          icon: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700'
        }
      case 'discount':
        return {
          bg: 'from-orange-500/20 to-amber-500/20',
          badge: 'bg-orange-100 text-orange-700 border-orange-200',
          icon: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700'
        }
      case 'commerce':
        return {
          bg: 'from-blue-500/20 to-cyan-500/20',
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
      default:
        return {
          bg: 'from-purple-500/20 to-pink-500/20',
          badge: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: 'text-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700'
        }
    }
  }

  const getPrizeIcon = (title: string, category?: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('pizza')) return <Pizza className="h-5 w-5" />
    if (lowerTitle.includes('helad')) return <IceCream className="h-5 w-5" />
    if (lowerTitle.includes('libr')) return <Book className="h-5 w-5" />
    if (lowerTitle.includes('cine') || lowerTitle.includes('entrada')) return <Film className="h-5 w-5" />
    if (lowerTitle.includes('plant') || lowerTitle.includes('abono')) return <Sprout className="h-5 w-5" />
    if (category === 'eco') return <Leaf className="h-5 w-5" />
    return <Gift className="h-5 w-5" />
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando sorteos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Sorteos</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Participa y gana premios increíbles
          </p>
        </div>

        <Card className="bg-gradient-to-br from-secondary to-secondary/80">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 text-secondary-foreground md:gap-3">
              <Coins className="h-6 w-6 md:h-8 md:w-8" />
              <div>
                <p className="text-xs opacity-90 md:text-sm">Tus puntos</p>
                <p className="text-xl font-bold md:text-2xl">{userPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-900 md:gap-3 md:p-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0 md:h-5 md:w-5" />
          <p className="text-sm md:text-base">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 shadow-sm md:p-5">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="rounded-full bg-blue-100 p-2 md:p-3">
            <Ticket className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 md:h-5 md:w-5" />
              <p className="text-base font-semibold text-blue-900 md:text-lg">¿Cómo funciona?</p>
            </div>
            <p className="text-xs leading-relaxed text-blue-800 md:text-sm">
              Cada boleto tiene un costo en <strong>Posadas Points</strong> que varía según el premio (10, 20, 30 o 40 puntos).
              Mientras más boletos compres, más oportunidades tienes de ganar. El sorteo se realiza automáticamente en la fecha indicada.
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-md bg-white/60 px-2 py-1.5 text-xs text-blue-700 md:mt-3 md:px-3 md:py-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0 md:h-4 md:w-4" />
              <span>Los puntos gastados en boletos NO afectan tu posición en el ranking de barrios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mis Participaciones - Minimalista */}
      {myParticipations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Mis Participaciones</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {myParticipations.length} {myParticipations.length === 1 ? 'sorteo' : 'sorteos'}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myParticipations.map(({ raffle, ticketCount }) => {
              const daysUntil = getDaysUntilDraw(raffle.draw_date)
              const colors = getCategoryColor(raffle.category)

              return (
                <Card key={raffle.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight mb-1 truncate">
                          {raffle.title}
                        </p>
                        {raffle.sponsor && (
                          <p className="text-xs text-muted-foreground truncate">{raffle.sponsor}</p>
                        )}
                      </div>
                      <div className={`rounded-full p-1.5 ${colors.bg}`}>
                        {getCategoryIcon(raffle.category)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5">
                        <Ticket className={`h-4 w-4 ${colors.icon}`} />
                        <span className="font-bold">{ticketCount}</span>
                        <span className="text-muted-foreground text-xs">
                          {ticketCount === 1 ? 'boleto' : 'boletos'}
                        </span>
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        daysUntil <= 3
                          ? 'bg-red-100 text-red-700'
                          : daysUntil <= 7
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {daysUntil}d
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Todos los Sorteos */}
      <div className="space-y-4">
        {myParticipations.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Todos los Sorteos</h2>
          </div>
        )}

        {raffles.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Trophy className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No hay sorteos activos</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Por el momento no hay sorteos disponibles. Vuelve pronto para participar en increíbles premios.
            </p>
            <p className="text-sm text-muted-foreground">
              Mientras tanto, sigue reciclando para acumular más puntos.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {raffles.map((raffle) => {
          const daysUntil = getDaysUntilDraw(raffle.draw_date)
          const maxTickets = Math.floor(userPoints / raffle.ticket_cost)
          const colors = getCategoryColor(raffle.category)

          return (
            <Card key={raffle.id} className="overflow-hidden border-2 transition-all duration-300 hover:shadow-lg">
              {/* Header con gradiente y categoría */}
              <div className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} p-4 md:p-6`}>
                <div className="absolute right-0 top-0 h-24 w-24 opacity-10 md:h-32 md:w-32">
                  {getCategoryIcon(raffle.category)}
                </div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className={`rounded-full bg-white/90 p-2 shadow-sm md:p-3 ${colors.icon}`}>
                    {getCategoryIcon(raffle.category)}
                  </div>
                  <div className={`rounded-full border px-2 py-1 text-xs font-bold shadow-sm md:px-3 md:py-1.5 ${
                    daysUntil <= 3
                      ? 'animate-pulse border-red-300 bg-red-100 text-red-700'
                      : daysUntil <= 7
                      ? 'border-amber-300 bg-amber-100 text-amber-700'
                      : 'border-blue-300 bg-blue-100 text-blue-700'
                  }`}>
                    {daysUntil} {daysUntil === 1 ? 'día' : 'días'}
                  </div>
                </div>
              </div>

              <CardHeader className="p-4 pb-3 md:p-6 md:pb-3">
                <div className="mb-2 flex items-start gap-2">
                  {getPrizeIcon(raffle.title, raffle.category)}
                  <CardTitle className="text-base leading-tight md:text-lg">{raffle.title}</CardTitle>
                </div>
                {raffle.sponsor && (
                  <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium md:px-2.5 md:py-1 ${colors.badge}`}>
                    <Store className="h-3 w-3" />
                    <span>{raffle.sponsor}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3 p-4 md:space-y-4 md:p-6">
                {/* Premio destacado */}
                <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-3 md:p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Trophy className="h-3 w-3 text-amber-600 md:h-4 md:w-4" />
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Premio</p>
                  </div>
                  <p className="font-display text-sm font-bold leading-snug text-amber-900 md:text-base">
                    {raffle.prize}
                  </p>
                </div>

                {/* Descripción */}
                <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                  {raffle.description}
                </p>

                {/* Fecha del sorteo */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="font-medium">Sorteo: {formatDate(raffle.draw_date)}</span>
                </div>

                {/* Selector de cantidad */}
                <div className="rounded-lg border-2 bg-muted/30 p-3 md:p-4">
                  <Label htmlFor={`quantity-${raffle.id}`} className="mb-2 block text-xs font-semibold md:mb-3 md:text-sm">
                    Cantidad de boletos
                  </Label>
                  <div className="flex items-center gap-2 md:gap-3">
                    <Input
                      id={`quantity-${raffle.id}`}
                      type="number"
                      min="1"
                      max={maxTickets || 1}
                      value={ticketQuantity}
                      onChange={(e) => setTicketQuantity(parseInt(e.target.value) || 1)}
                      className="w-16 text-center font-bold md:w-20"
                    />
                    <div className="flex flex-1 items-center gap-2 rounded-md border bg-white px-2 py-1.5 md:px-3 md:py-2">
                      <Coins className={`h-4 w-4 md:h-5 md:w-5 ${colors.icon}`} />
                      <span className="text-base font-bold md:text-lg">
                        {ticketQuantity * raffle.ticket_cost}
                      </span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {maxTickets > 0
                      ? `Puedes comprar hasta ${maxTickets} boleto${maxTickets !== 1 ? 's' : ''}`
                      : 'No tienes suficientes puntos'
                    }
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-2 md:p-6 md:pt-2">
                <Button
                  onClick={() => handleBuyTickets(raffle, ticketQuantity)}
                  disabled={maxTickets === 0 || ticketQuantity > maxTickets}
                  className={`w-full text-sm font-bold text-white shadow-md transition-all hover:shadow-lg md:text-base ${colors.button}`}
                >
                  <Ticket className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  {maxTickets === 0 ? 'Puntos insuficientes' : `Comprar por ${raffle.ticket_cost} pts/boleto`}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
          </div>
        )}
      </div>

      {/* Modal de éxito mejorado */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ¡Boletos Comprados con Éxito!
            </DialogTitle>
            <div className="text-center space-y-2 pt-2">
              <p className="text-base text-muted-foreground">
                Has participado en el sorteo
              </p>
              <p className="font-semibold text-lg text-foreground">
                {selectedRaffle?.title}
              </p>
              {selectedRaffle?.sponsor && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  <Store className="h-3 w-3" />
                  <span>{selectedRaffle.sponsor}</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Premio */}
            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-bold text-amber-900 uppercase">Premio en juego</p>
              </div>
              <p className="font-display text-lg font-bold text-amber-900">
                {selectedRaffle?.prize}
              </p>
            </div>

            {/* Boletos */}
            <div className="rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-emerald-900">
                  Tus números de boleto:
                </p>
                <div className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {ticketNumbers.length} {ticketNumbers.length === 1 ? 'boleto' : 'boletos'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ticketNumbers.map((number, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-white border-2 border-emerald-200 p-3 text-center hover:border-emerald-400 transition-colors"
                  >
                    <Ticket className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
                    <p className="font-mono text-sm font-bold text-emerald-900">
                      {number}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Información del sorteo */}
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Fecha del sorteo</p>
                  <p className="text-sm text-blue-700">
                    {selectedRaffle && formatDate(selectedRaffle.draw_date)}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Te notificaremos por email si resultas ganador
                  </p>
                </div>
              </div>
            </div>

            {/* Puntos restantes */}
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div>
                <p className="text-sm text-muted-foreground">Puntos restantes</p>
                <p className="text-2xl font-bold text-purple-700">{userPoints}</p>
              </div>
              <Coins className="h-10 w-10 text-purple-400" />
            </div>

            {/* Recordatorio importante */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
              <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800">
                <strong>Importante:</strong> Los puntos gastados en boletos NO afectan tu posición en el ranking de barrios.
                ¡Sigue reciclando para ganar más puntos!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-md"
            >
              ¡Entendido, mucha suerte!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
