import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const staff_id = searchParams.get('staff_id')

    console.log('📊 Stats API - Staff ID:', staff_id)

    if (!staff_id) {
      return NextResponse.json(
        { error: 'ID de staff requerido' },
        { status: 400 }
      )
    }

    // Obtener todas las validaciones del staff desde recycling_tokens
    // Ya que recycling_tokens tiene el campo validated_by
    const { data: tokens, error } = await supabase
      .from('recycling_tokens')
      .select('material_type')
      .eq('validated_by', staff_id)
      .eq('status', 'validated')

    console.log('📊 Tokens encontrados:', tokens?.length || 0)
    console.log('📊 Tokens por tipo:', tokens)

    if (error) {
      console.error('❌ Error fetching tokens:', error)
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      )
    }

    // Contar por tipo de material
    // Cada token representa: AVU = 1 litro, Lata = 1 lata, Botella = 1 botella
    let avu_liters = 0
    let can_count = 0
    let bottle_count = 0

    tokens?.forEach((token: any) => {
      switch (token.material_type) {
        case 'avu':
          avu_liters += 1
          break
        case 'lata':
          can_count += 1
          break
        case 'botella':
          bottle_count += 1
          break
      }
    })

    const result = {
      avu_liters,
      can_count,
      bottle_count,
      total_validations: tokens?.length || 0
    }

    console.log('✅ Estadísticas calculadas:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en stats endpoint:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
