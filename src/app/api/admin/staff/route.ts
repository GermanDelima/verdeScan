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

// Función simple de hash (en producción deberías usar bcrypt)
function simpleHash(password: string): string {
  // IMPORTANTE: En producción, usa bcrypt o argon2
  // Esto es solo para demostración
  return Buffer.from(password).toString('base64')
}

// GET - Listar todas las cuentas de staff
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verificar que sea admin
    const { isAdmin, error: authError } = await verifyAdmin(supabase)
    if (!isAdmin) {
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    // Obtener todas las cuentas de staff
    const { data: accounts, error } = await supabase
      .from('staff_accounts')
      .select('id, username, account_type, created_at, is_active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener cuentas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error en GET /api/admin/staff:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva cuenta de staff
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verificar que sea admin
    const { isAdmin, userId, error: authError } = await verifyAdmin(supabase)
    if (!isAdmin) {
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    // Obtener datos del request
    const body = await request.json()
    const { username, password, account_type } = body

    // Validar datos
    if (!username || !password || !account_type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: username, password, account_type' },
        { status: 400 }
      )
    }

    if (account_type !== 'promotor' && account_type !== 'ecopunto') {
      return NextResponse.json(
        { error: 'account_type debe ser "promotor" o "ecopunto"' },
        { status: 400 }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const passwordHash = simpleHash(password)

    // Crear la cuenta
    const { data, error } = await supabase
      .from('staff_accounts')
      .insert({
        username,
        password_hash: passwordHash,
        account_type,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear cuenta:', error)

      // Verificar si es un error de username duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'El nombre de usuario ya existe' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      account: {
        id: data.id,
        username: data.username,
        account_type: data.account_type,
        created_at: data.created_at,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/admin/staff:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
