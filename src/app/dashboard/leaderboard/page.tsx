// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, TrendingUp, Users, Award, Sparkles, TreePine, Paintbrush, Heart } from "lucide-react"

interface NeighborhoodRanking {
  neighborhood: string
  total_points: number
  user_count: number
  avg_points: number
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<NeighborhoodRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener datos agregados del ranking usando la función
      const { data: rankingsData, error: rankingsError } = await supabase
        .rpc("get_neighborhood_rankings")

      if (rankingsError) throw rankingsError

      console.log("Rankings obtenidos:", rankingsData)
      console.log("Total de barrios:", rankingsData?.length)

      // Convertir a formato esperado
      const rankingsArray: NeighborhoodRanking[] = (rankingsData || []).map((row: any) => ({
        neighborhood: row.neighborhood,
        total_points: row.total_points || 0,
        user_count: row.user_count || 0,
        avg_points: row.avg_points || 0,
      }))

      setRankings(rankingsArray)
    } catch (error: any) {
      console.error("Error fetching rankings:", error)
      setError(error.message || "Error al cargar el ranking")
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Award className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-700" />
      default:
        return <div className="h-6 w-6 flex items-center justify-center text-muted-foreground font-bold">{position}</div>
    }
  }

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300"
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300"
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300"
      default:
        return "bg-white border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Ranking de Barrios</h1>
          <p className="text-sm text-muted-foreground md:text-base">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Ranking de Barrios</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 pt-6 md:p-6">
            <p className="text-sm text-red-900 md:text-base">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Ranking de Barrios</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Descubre qué barrios están liderando el reciclaje en Posadas
        </p>
      </div>


      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Total Barrios</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{rankings.length}</div>
            <p className="text-xs text-muted-foreground">Barrios participando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Puntos Totales</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {rankings.reduce((sum, r) => sum + r.total_points, 0).toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-muted-foreground">Entre todos los barrios</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Usuarios Activos</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {rankings.reduce((sum, r) => sum + r.user_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Trophy className="h-4 w-4 md:h-5 md:w-5" />
            Ranking de Barrios
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Clasificación basada en puntos totales acumulados por barrio
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {rankings.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground md:py-12">
              <Trophy className="mx-auto mb-4 h-10 w-10 opacity-20 md:h-12 md:w-12" />
              <p className="text-sm md:text-base">No hay datos de ranking disponibles todavía</p>
              <p className="mt-2 text-xs md:text-sm">¡Sé el primero en registrarte y ganar puntos!</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {rankings.map((ranking, index) => (
                <div
                  key={ranking.neighborhood}
                  className={`flex flex-col gap-3 rounded-lg border-2 p-3 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4 ${getMedalColor(
                    index + 1
                  )}`}
                >
                  <div className="flex flex-1 items-center gap-3 sm:gap-4">
                    <div className="flex w-6 flex-shrink-0 justify-center sm:w-8">
                      {getMedalIcon(index + 1)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold sm:text-lg">{ranking.neighborhood}</h3>
                      <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-4 sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {ranking.user_count} {ranking.user_count === 1 ? "usuario" : "usuarios"}
                        </span>
                        <span>
                          Promedio: {ranking.avg_points} pts/usuario
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl font-bold text-primary sm:text-2xl">
                      {ranking.total_points.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">puntos</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">¿Cómo funciona el ranking?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 text-xs md:p-6 md:text-sm">
          <p>
            <strong>Puntos Totales:</strong> Suma de todos los puntos ganados por los usuarios del barrio
          </p>
          <p>
            <strong>Promedio:</strong> Puntos totales dividido por la cantidad de usuarios del barrio
          </p>
          <p className="pt-2 text-muted-foreground">
            💡 <strong>Tip:</strong> Invita a tus vecinos a unirse a VerdeScan para que tu barrio suba en el ranking
          </p>
        </CardContent>
      </Card>

    </div>
  )
}
