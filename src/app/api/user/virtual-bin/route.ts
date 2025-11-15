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

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Verificar autenticación desde cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener el tacho virtual del usuario
    const { data: virtualBin, error: binError } = await supabase
      .from('user_virtual_bin')
      .select('material_type, quantity')
      .eq('user_id', user.id)

    if (binError) {
      console.error('Error al obtener tacho virtual:', binError)
      return NextResponse.json(
        { error: 'Error al cargar el tacho virtual' },
        { status: 500 }
      )
    }

    // Convertir a un objeto más fácil de usar
    const binMap: Record<string, number> = {}
    if (virtualBin) {
      virtualBin.forEach(item => {
        binMap[item.material_type] = item.quantity
      })
    }

    return NextResponse.json({
      success: true,
      virtualBin: binMap,
      materials: {
        avu: binMap.avu || 0,
        lata: binMap.lata || 0,
        botella: binMap.botella || 0
      }
    })

  } catch (error) {
    console.error('Error en API de tacho virtual:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
