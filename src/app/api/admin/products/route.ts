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

// GET - Listar todos los productos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verificar que sea admin
    const { isAdmin, error: authError } = await verifyAdmin(supabase)
    if (!isAdmin) {
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    // Obtener todos los productos (usar adminClient para bypass RLS)
    const adminClient = createSupabaseAdminClient()
    const { data: products, error } = await adminClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener productos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error en GET /api/admin/products:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verificar que sea admin
    const { isAdmin, error: authError } = await verifyAdmin(supabase)
    if (!isAdmin) {
      return NextResponse.json({ error: authError }, { status: 403 })
    }

    // Obtener datos del request
    const body = await request.json()
    const { gtin, name, weight, category, points_per_kg, active } = body

    // Validar datos requeridos
    if (!gtin || !name || !weight || !category) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: gtin, name, weight, category' },
        { status: 400 }
      )
    }

    // Validar que weight sea un número positivo
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      return NextResponse.json(
        { error: 'El peso debe ser un número positivo' },
        { status: 400 }
      )
    }

    // Validar points_per_kg si se proporciona
    const pointsNum = points_per_kg ? parseInt(points_per_kg) : 50
    if (isNaN(pointsNum) || pointsNum < 0) {
      return NextResponse.json(
        { error: 'Los puntos por kg deben ser un número no negativo' },
        { status: 400 }
      )
    }

    // Validar que el GTIN tenga el formato correcto (13 dígitos)
    if (!/^\d{13}$/.test(gtin)) {
      return NextResponse.json(
        { error: 'El código GTIN debe tener exactamente 13 dígitos' },
        { status: 400 }
      )
    }

    // Usar adminClient para bypass RLS
    const adminClient = createSupabaseAdminClient()

    // Crear el producto
    const { data, error } = await adminClient
      .from('products')
      .insert({
        gtin,
        name,
        weight: weightNum,
        category,
        points_per_kg: pointsNum,
        active: active !== undefined ? active : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear producto:', error)

      // Verificar si es un error de GTIN duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese código GTIN' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Producto creado exitosamente',
      product: data
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/admin/products:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
