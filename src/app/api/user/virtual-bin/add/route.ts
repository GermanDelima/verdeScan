// @ts-nocheck
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/supabase/types'

// Helper para crear cliente con cookies
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
            // Puede fallar en middleware, ignorar
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Puede fallar en middleware, ignorar
          }
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { material_type, quantity = 1 } = body

    // Validar material type
    if (!material_type || !['avu', 'lata', 'botella'].includes(material_type)) {
      return NextResponse.json(
        { error: 'Tipo de material inválido' },
        { status: 400 }
      )
    }

    // Usar la función de la base de datos para agregar al tacho
    const { error: addError } = await supabase.rpc('add_to_virtual_bin', {
      p_user_id: user.id,
      p_material_type: material_type,
      p_quantity: quantity
    })

    if (addError) {
      console.error('Error al agregar material al tacho:', addError)
      return NextResponse.json(
        {
          error: 'Error al agregar material al tacho',
          details: addError.message,
          code: addError.code,
          hint: addError.hint
        },
        { status: 500 }
      )
    }

    // Obtener el tacho actualizado
    const { data: virtualBin, error: binError } = await supabase
      .from('user_virtual_bin')
      .select('material_type, quantity')
      .eq('user_id', user.id)

    if (binError) {
      console.error('Error al obtener tacho actualizado:', binError)
    }

    const binMap: Record<string, number> = {}
    if (virtualBin) {
      virtualBin.forEach(item => {
        binMap[item.material_type] = item.quantity
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Material agregado al tacho virtual',
      virtualBin: binMap,
      materials: {
        avu: binMap.avu || 0,
        lata: binMap.lata || 0,
        botella: binMap.botella || 0
      }
    })

  } catch (error) {
    console.error('Error en API de agregar a tacho virtual:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
