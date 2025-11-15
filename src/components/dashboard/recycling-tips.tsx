"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface RecyclingTipsProps {
  className?: string
}

export function RecyclingTips({ className }: RecyclingTipsProps) {
  const { userProfile } = useAuth()
  const [activity, setActivity] = useState("")
  const [tip, setTip] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerateTip = async () => {
    // Validaciones
    if (!activity.trim()) {
      setError("Por favor describe tu actividad de reciclaje")
      return
    }

    if (activity.length < 10) {
      setError("Por favor describe tu actividad con más detalle")
      return
    }

    if (!userProfile?.neighborhood) {
      setError("No se encontró tu barrio. Actualiza tu perfil.")
      return
    }

    setLoading(true)
    setError("")
    setTip("")

    try {
      const response = await fetch("/api/recycling-tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          neighborhood: userProfile.neighborhood,
          recentActivity: activity,
          userPoints: userProfile.points,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al generar el consejo")
      }

      setTip(data.tip)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el consejo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Consejo Personalizado del Día
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Usamos IA para darte consejos de reciclaje basados en tu ubicación y hábitos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Ubicación (Barrio)
          </label>
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
            {userProfile?.neighborhood || "No especificado"}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="activity" className="text-sm font-medium">
            Contanos qué reciclaste últimamente
          </label>
          <textarea
            id="activity"
            value={activity}
            onChange={(e) => {
              setActivity(e.target.value)
              setError("")
            }}
            placeholder="Ej: Esta semana separé botellas de plástico y cartón, pero no sé qué hacer con las latas."
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          />
        </div>

        <Button
          onClick={handleGenerateTip}
          disabled={loading || !activity.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando Consejo
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Consejo
            </>
          )}
        </Button>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {tip && (
          <div className="rounded-md border border-green-500/50 bg-green-50 p-4 dark:bg-green-950/20">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm leading-relaxed text-green-900 dark:text-green-100">
                {tip}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
