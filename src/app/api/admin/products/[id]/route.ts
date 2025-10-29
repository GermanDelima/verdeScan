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

// PUT - Actualizar un producto existente
export async function PUT(
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

    // Obtener datos del request
    const body = await request.json()
    const { gtin, name, weight, category, points_per_kg, active } = body

    // Validar que al menos haya un campo para actualizar
    if (!gtin && !name && weight === undefined && !category && points_per_kg === undefined && active === undefined) {
      return NextResponse.json(
        { error: 'Debes proporcionar al menos un campo para actualizar' },
        { status: 400 }
      )
    }

    // Construir objeto de actualización
    const updateData: any = {}

    if (gtin !== undefined) {
      // Validar formato GTIN
      if (!/^\d{13}$/.test(gtin)) {
        return NextResponse.json(
          { error: 'El código GTIN debe tener exactamente 13 dígitos' },
          { status: 400 }
        )
      }
      updateData.gtin = gtin
    }

    if (name !== undefined) {
      updateData.name = name
    }

    if (weight !== undefined) {
      const weightNum = parseFloat(weight)
      if (isNaN(weightNum) || weightNum <= 0) {
        return NextResponse.json(
          { error: 'El peso debe ser un número positivo' },
          { status: 400 }
        )
      }
      updateData.weight = weightNum
    }

    if (category !== undefined) {
      updateData.category = category
    }

    if (points_per_kg !== undefined) {
      const pointsNum = parseInt(points_per_kg)
      if (isNaN(pointsNum) || pointsNum < 0) {
        return NextResponse.json(
          { error: 'Los puntos por kg deben ser un número no negativo' },
          { status: 400 }
        )
      }
      updateData.points_per_kg = pointsNum
    }

    if (active !== undefined) {
      updateData.active = active
    }

    // Usar adminClient para bypass RLS
    const adminClient = createSupabaseAdminClient()

    // Actualizar el producto
    // @ts-ignore - Supabase type issue
    const { data, error } = await adminClient
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al actualizar producto:', error)

      // Verificar si es un error de GTIN duplicado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe otro producto con ese código GTIN' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Producto actualizado exitosamente',
      product: data
    })
  } catch (error) {
    console.error('Error en PUT /api/admin/products/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un producto
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

    // Usar adminClient para bypass RLS
    const adminClient = createSupabaseAdminClient()

    // Eliminar el producto
    const { data, error } = await adminClient
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al eliminar producto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Producto eliminado exitosamente',
      product: data
    })
  } catch (error) {
    console.error('Error en DELETE /api/admin/products/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
