// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/supabase/types'

// Helper para crear cliente de Supabase
async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Las cookies solo se pueden establecer en Server Actions o Route Handlers
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Las cookies solo se pueden eliminar en Server Actions o Route Handlers
          }
        },
      },
    }
  )
}

// Helper para crear cliente admin
function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Generar código de token único
function generateTokenCode(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Sin I, O para evitar confusión
  let result = ''

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

// POST - Generar un nuevo token de reciclaje
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const adminClient = createSupabaseAdminClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener datos del request
    const body = await request.json()
    const { material_type, quantity = 1 } = body

    console.log('1. Generando token para:', { user_id: user.id, material_type, quantity })

    // Validar material_type
    if (!material_type || !['avu', 'lata', 'botella'].includes(material_type)) {
      return NextResponse.json(
        { error: 'Tipo de material inválido' },
        { status: 400 }
      )
    }

    // Validar quantity
    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Cantidad debe ser al menos 1' },
        { status: 400 }
      )
    }

    // Obtener configuración de puntos para este material
    const { data: config, error: configError } = await adminClient
      .from('material_points_config')
      .select('*')
      .eq('material_type', material_type)
      .single()

    console.log('2. Configuración de puntos:', { config, configError })

    if (configError || !config) {
      return NextResponse.json(
        { error: 'No se pudo obtener la configuración de puntos' },
        { status: 500 }
      )
    }

    // Generar código de token único
    let tokenCode = ''
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      tokenCode = generateTokenCode()

      // Verificar si el código ya existe
      const { data: existing } = await adminClient
        .from('recycling_tokens')
        .select('id')
        .eq('token_code', tokenCode)
        .single()

      if (!existing) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'No se pudo generar un código único. Intenta nuevamente.' },
        { status: 500 }
      )
    }

    console.log('3. Código de token generado:', tokenCode)

    // Calcular fecha de expiración (15 minutos desde ahora)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Calcular puntos totales (puntos por unidad * cantidad)
    const totalPoints = config.points_per_unit * quantity

    // Crear el token en la base de datos
    const { data: token, error: tokenError } = await adminClient
      .from('recycling_tokens')
      .insert({
        user_id: user.id,
        token_code: tokenCode,
        material_type: material_type,
        points_value: totalPoints,
        quantity: quantity,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    console.log('4. Token creado:', { token, tokenError })

    if (tokenError) {
      console.error('Error al crear token:', tokenError)
      return NextResponse.json(
        { error: 'Error al crear el token' },
        { status: 500 }
      )
    }

    // Retornar el token generado
    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        code: token.token_code,
        material_type: token.material_type,
        points_value: token.points_value,
        quantity: quantity,
        expires_at: token.expires_at,
        unit_description: config.unit_description,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error en POST /api/tokens/generate:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
