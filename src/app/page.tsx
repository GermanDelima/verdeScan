"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Leaf, QrCode, Trophy, ArrowRight, Recycle, Users,
  Sparkles, TrendingUp, Ticket, Award, Star, Zap, Target, Trash2
} from "lucide-react"
import { useState } from "react"

export default function Home() {
  const [activeStep, setActiveStep] = useState(0)

  // Ranking estático de barrios - hardcodeado para mejor rendimiento
  const neighborhoods = [
    { name: "Villa Cabello", points: 8450, rank: 1, users: 127 },
    { name: "Centro", points: 7820, rank: 2, users: 145 },
    { name: "Villa Urquiza", points: 6930, rank: 3, users: 98 },
    { name: "San Jorge", points: 5640, rank: 4, users: 76 },
    { name: "Itaembé Miní", points: 4780, rank: 5, users: 63 }
  ]

  const flowSteps = [
    {
      number: 1,
      title: "PREPARA Y GENERA TU VALE",
      description: "Escanea el GTIN de tus latas en casa o juntá tu AVU 'Aceite vegetal usado'. Al llegar al Kiosco o Ecopunto, toca 'Canjear Puntos' en la app. El sistema genera un Token Único (OTC) válido por 15 minutos.",
      icon: QrCode,
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: 2,
      title: "VALIDACIÓN Y ACREDITACIÓN",
      description: "Mostrá tu Token al referente del kiosco o Ecopunto. Él verifica el material, ingresa el código y, si es válido, recibís tus puntos al instante. El Token se invalida automáticamente. Para evitar su reutilización. ",
      icon: Zap,
      color: "from-amber-500 to-orange-500"
    },
    {
      number: 3,
      title: "USA TUS PUNTOS",
      description: "¡Tus puntos ya están acreditados y listos para usar! Ingresá tu número de tarjeta SUBE Misionero y canjealos por saldo, premios, sorteos o donaciones a proyectos sociales y medioambientales.",
      icon: Target,
      color: "from-green-500 to-emerald-500"
    }
  ]

  const raffleOptions = [
    { points: 10, description: "Boleto Básico" },
    { points: 20, description: "Boleto Premium" },
    { points: 30, description: "Boleto Gold" },
    { points: 40, description: "Boleto Platino" }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary">
        {/* Background Pattern with Recycling Icons */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Icons Pattern */}
          <Recycle className="absolute top-10 left-10 h-32 w-32 text-white/10 transform rotate-12" />
          <Trash2 className="absolute top-20 right-20 h-24 w-24 text-white/10 transform -rotate-6" />
          <Recycle className="absolute bottom-20 left-20 h-28 w-28 text-white/10 transform rotate-45" />
          <Leaf className="absolute top-40 right-40 h-36 w-36 text-white/10 transform -rotate-12" />
          <Recycle className="absolute bottom-40 right-10 h-40 w-40 text-white/10 transform rotate-90" />
          <Trash2 className="absolute top-1/2 left-1/4 h-20 w-20 text-white/10 transform -rotate-45" />
          <Leaf className="absolute top-1/3 right-1/3 h-24 w-24 text-white/10 transform rotate-12" />
          <Leaf className="absolute bottom-10 left-1/3 h-32 w-32 text-white/10 transform rotate-6" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-lg px-6 py-2 hover:bg-white/30">
              <Sparkles className="mr-2 h-5 w-5" />
              VerdeScan
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Tu Reciclaje ahora vale el doble
            </h1>
            <p className="mt-6 text-2xl leading-8 text-white/95 font-medium">
              Sistema de Devolución y Recompensa
            </p>
            <p className="mt-3 text-lg text-white/80 max-w-3xl mx-auto">
              Transformá tu hábito de reciclaje en un acto continuo, colectivo y altamente gratificante
            </p>
            <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6">
                  Comenzar ahora
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

            </div>
          </div>
        </div>
      </div>

      {/* Interactive Flow Section */}
      <div className="bg-gradient-to-b from-muted/30 to-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              <Recycle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              ¿Cómo funciona el sistema VerdeScan?
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Tres simples pasos para transformar tu reciclaje
            </p>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            {flowSteps.map((step, index) => {
              const Icon = step.icon
              const isActive = activeStep === index
              return (
                <div
                  key={step.number}
                  className="relative"
                  onMouseEnter={() => setActiveStep(index)}
                >
                  <Card
                    className={`border-2 transition-all duration-300 cursor-pointer h-full ${
                      isActive
                        ? "border-primary shadow-2xl scale-105 bg-primary/5"
                        : "border-border hover:border-primary/50 hover:shadow-lg"
                    }`}
                  >
                    <CardContent className="p-8">
                      <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg mx-auto`}>
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-center">
                        <Badge className="mb-3 bg-primary text-white text-lg px-4 py-1">
                          Paso {step.number}
                        </Badge>
                        <h3 className="mb-3 font-display text-2xl font-bold">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Arrow connector */}
                  {index < flowSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>


        </div>
      </div>

      {/* Raffle Section */}
      <div className="py-24 sm:py-32 bg-gradient-to-b from-purple-50 to-background">
        <div className="mx-auto max-w-7xl px-6">
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Trophy className="h-64 w-64 text-purple-600" />
            </div>
            <CardHeader className="relative">
              <div className="flex items-center justify-center mb-4">
                <Ticket className="h-12 w-12 text-purple-600" />
              </div>
              <CardTitle className="text-center text-3xl sm:text-4xl">
                Participa y Gana Premios Increíbles
              </CardTitle>
              <p className="text-center text-lg text-muted-foreground mt-2">
                Gamificación Dinámica - Módulo de Sorteos
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {raffleOptions.map((option, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-xl bg-white border-2 border-purple-200 hover:border-purple-400 transition-all hover:scale-105 hover:shadow-xl cursor-pointer text-center"
                  >
                    <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {option.points} PR
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-amber-900">
                  ⚡ Los puntos gastados en boletos NO afectan tu posición en el Ranking de Barrios
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  ¡Participa sin desmotivar el esfuerzo colectivo!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Community Impact Section */}
      <div className="py-24 sm:py-32 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-white text-lg px-6 py-2">
              <Users className="mr-2 h-5 w-5" />
              Impacto Comunitario
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl mb-4">
              ¡Tu barrio puede liderar el cambio!
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cada punto de reciclaje suma, cada acción cuenta. Seguí el ranking en tiempo real, inspirá a tus vecinos y convertí a tu comunidad en un ejemplo de impacto positivo. 
            </p>
          </div>

          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Trophy className="h-8 w-8" />
                Ranking de Barrios
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {neighborhoods.map((neighborhood, index) => (
                  <div
                    key={index}
                    className={`p-6 flex items-center justify-between transition-all hover:bg-muted/50 ${
                      index === 0 ? "bg-amber-50" : index === 1 ? "bg-gray-50" : index === 2 ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl ${
                          index === 0
                            ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                            : index === 2
                            ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {neighborhood.rank}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{neighborhood.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {neighborhood.points.toLocaleString('es-AR')} Puntos de Reciclaje
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-sm px-3 py-1">
                        <Users className="h-3 w-3 mr-1" />
                        {neighborhood.users} {neighborhood.users === 1 ? 'usuario' : 'usuarios'}
                      </Badge>
                      {index < 3 && <Award className="h-6 w-6 text-amber-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-green-200 bg-green-50/50 text-center">
              <CardContent className="p-6">
                <Recycle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-xl mb-2">Economía Circular en Acción</h3>
                <p className="text-sm text-muted-foreground">
                  Cada lata, cada litro de AVU, cada punto que sumás es parte de un ciclo que transforma residuos en recursos.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-200 bg-blue-50/50 text-center">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-xl mb-2">Poder Vecinal</h3>
                <p className="text-sm text-muted-foreground">
                  Tu barrio puede liderar el cambio y ser ejemplo de compromiso ambiental.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-purple-200 bg-purple-50/50 text-center">
              <CardContent className="p-6">
                <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-xl mb-2">Compromiso Barrial</h3>
                <p className="text-sm text-muted-foreground">
                  Más participación, más conciencia, más impacto positivo en la ciudad.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-5xl mb-3">
            ¿Listo para ser parte del cambio?
          </h2>
          <p className="mt-4 text-xl text-white/90 max-w-2xl mx-auto">
            Únete a la comunidad de recicladores de Posadas y transforma tu barrio
          </p>
          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6">
                Comenzar ahora
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="gap-2 border-white bg-white text-black hover:bg-white/10 hover:text-white text-lg px-8 py-6">
                Crear cuenta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="font-display text-xl font-bold">
                  VerdeScan
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Transforma tu hábito de reciclaje en recompensas reales
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Enlaces</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Aliados</h3>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Secretaría de Estado de Cambio Climático Misiones
                </p>
                <p className="mt-2 text-xs">
                  En colaboración con el programa de reciclaje y sostenibilidad de la provincia
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 VerdeScan. Todos los derechos reservados.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Desarrollado por <a href="https://www.linkedin.com/in/jos%C3%ADasgerm%C3%A1ndelima/" target="_blank" rel="noopener noreferrer"> <strong>Josías Germán De Lima</strong></a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
