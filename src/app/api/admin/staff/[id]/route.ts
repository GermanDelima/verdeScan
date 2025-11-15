// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/supabase/types'

// Helper para crear cliente de Supabase en el servidor (para autenticación)
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

// Helper para crear cliente de Supabase con SERVICE_ROLE_KEY (bypasa RLS)
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

// Verificar si el usuario es admin
async function verifyAdmin(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { isAdmin: false, error: 'No autenticado' }
  }

  // Usar adminClient para bypass RLS y verificar el rol
  const adminClient = createSupabaseAdminClient()
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || (userData as any).role !== 'admin') {
    return { isAdmin: false, error: 'No tienes permisos de administrador' }
  }

  return { isAdmin: true, userId: user.id }
}

// DELETE - Eliminar una cuenta de staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verificar que sea admin
    const { isAdmin, error: authError } = await verifyAdmin(supabase)
    if (!isAdmin) {
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    const { id } = await params

    // Verificar que el ID sea válido
    if (!id) {
      return NextResponse.json(
        { error: 'ID de cuenta no proporcionado' },
        { status: 400 }
      )
    }

    // Eliminar la cuenta
    const { error } = await supabase
      .from('staff_accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error al eliminar cuenta:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Cuenta eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error en DELETE /api/admin/staff/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
