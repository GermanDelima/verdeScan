// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { neighborhood, recentActivity, userPoints } = body

    // Validación básica
    if (!neighborhood || !recentActivity) {
      return NextResponse.json(
        { error: 'Se requiere barrio y actividad reciente' },
        { status: 400 }
      )
    }

    if (recentActivity.length < 10) {
      return NextResponse.json(
        { error: 'Por favor describe tu actividad con más detalle (mínimo 10 caracteres)' },
        { status: 400 }
      )
    }

    // Importación dinámica para evitar errores en build time
    const { generateRecyclingTip } = await import('@/lib/ai/personalized-recycling-tips')
    // Generar consejo con IA
    const result = await generateRecyclingTip(
      neighborhood,
      recentActivity,
      userPoints
    )

    return NextResponse.json({
      success: true,
      tip: result.tip,
      category: result.category,
    })
  } catch (error) {
    console.error('Error in recycling-tip API:', error)

    // Manejo de errores específicos
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Configuración de API incorrecta. Verifica tu GOOGLE_API_KEY.' },
          { status: 500 }
        )
      }

      // Log del error completo para debugging
      console.error('Stack trace:', error.stack)

      return NextResponse.json(
        { error: `Error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Error al generar el consejo. Intenta nuevamente.' },
      { status: 500 }
    )
  }
}
