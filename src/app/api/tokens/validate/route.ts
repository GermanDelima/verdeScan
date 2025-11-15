// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/supabase/types'

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

// POST - Validar un token y acreditar puntos
export async function POST(request: NextRequest) {
  try {
    const adminClient = createSupabaseAdminClient()

    // Obtener datos del request
    const body = await request.json()
    const { token_code, staff_id } = body

    console.log('1. Validando token:', { token_code, staff_id })

    // Validar parámetros
    if (!token_code || !staff_id) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: token_code y staff_id' },
        { status: 400 }
      )
    }

    // Verificar que el staff_id existe y está activo
    const { data: staffAccount, error: staffError } = await adminClient
      .from('staff_accounts')
      .select('*')
      .eq('id', staff_id)
      .eq('is_active', true)
      .single()

    if (staffError || !staffAccount) {
      return NextResponse.json(
        { error: 'Cuenta de staff no válida o inactiva' },
        { status: 403 }
      )
    }

    console.log('2. Staff verificado:', staffAccount.username)

    // Buscar el token
    const { data: token, error: tokenError } = await adminClient
      .from('recycling_tokens')
      .select('*')
      .eq('token_code', token_code.toUpperCase().trim())
      .single()

    console.log('3. Token encontrado:', { token, tokenError })

    if (tokenError) {
      if (tokenError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Token no encontrado. Verifica el código.' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Error al buscar el token' },
        { status: 500 }
      )
    }

    // Verificar el estado del token
    if (token.status === 'validated') {
      return NextResponse.json(
        { error: 'Este token ya fue validado anteriormente' },
        { status: 400 }
      )
    }

    if (token.status === 'expired') {
      return NextResponse.json(
        { error: 'Este token ha expirado' },
        { status: 400 }
      )
    }

    if (token.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Este token fue cancelado' },
        { status: 400 }
      )
    }

    // Verificar si el token ha expirado (por tiempo)
    const expiresAt = new Date(token.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      // Marcar como expirado
      await adminClient
        .from('recycling_tokens')
        .update({ status: 'expired' })
        .eq('id', token.id)

      return NextResponse.json(
        { error: 'Este token ha expirado. Por favor genera uno nuevo.' },
        { status: 400 }
      )
    }

    console.log('4. Token válido, acreditando puntos...')

    // Obtener información del usuario
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', token.user_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'No se pudo obtener información del usuario' },
        { status: 500 }
      )
    }

    console.log('5. Usuario encontrado:', userData.name)

    // Acreditar puntos al usuario
    const newPoints = userData.points + token.points_value
    const newTotalEarned = userData.total_earned_points + token.points_value

    const { error: updateUserError } = await adminClient
      .from('users')
      .update({
        points: newPoints,
        total_earned_points: newTotalEarned,
      })
      .eq('id', token.user_id)

    if (updateUserError) {
      console.error('Error al actualizar puntos del usuario:', updateUserError)
      return NextResponse.json(
        { error: 'Error al acreditar puntos' },
        { status: 500 }
      )
    }

    console.log('6. Puntos acreditados:', { newPoints, pointsEarned: token.points_value })

    // Remover del tacho virtual (vaciar el tacho)
    const quantityToRemove = token.quantity || 1
    try {
      const { error: removeError } = await adminClient
        .rpc('remove_from_virtual_bin', {
          p_user_id: token.user_id,
          p_material_type: token.material_type,
          p_quantity: quantityToRemove
        })

      if (removeError) {
        console.warn('No se pudo remover del tacho virtual:', removeError)
        // No es crítico, continuar con la validación
      } else {
        console.log(`6.1. Material removido del tacho virtual: ${quantityToRemove} unidades`)
      }
    } catch (binError) {
      console.warn('Error al remover del tacho virtual:', binError)
      // No es crítico si la tabla no existe aún
    }

    // Marcar el token como validado
    const { error: updateTokenError } = await adminClient
      .from('recycling_tokens')
      .update({
        status: 'validated',
        validated_at: new Date().toISOString(),
        validated_by: staff_id,
        validation_location: staffAccount.username,
      })
      .eq('id', token.id)

    if (updateTokenError) {
      console.error('Error al marcar token como validado:', updateTokenError)
      // Nota: Los puntos ya se acreditaron, pero no pudimos marcar el token
      // En producción, esto debería ser una transacción
    }

    console.log('7. Validación completada exitosamente')

    // Retornar éxito
    return NextResponse.json({
      success: true,
      message: 'Token validado y puntos acreditados exitosamente',
      validation: {
        user_name: userData.name,
        user_email: userData.email,
        material_type: token.material_type,
        points_credited: token.points_value,
        previous_points: userData.points,
        new_points: newPoints,
        validated_by: staffAccount.username,
        validated_at: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error en POST /api/tokens/validate:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
