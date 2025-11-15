// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/supabase/types'

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

// Función simple de verificación de hash
function verifyPassword(inputPassword: string, storedHash: string): boolean {
  // IMPORTANTE: En producción, usa bcrypt.compare()
  // Esto es solo para demostración
  const inputHash = Buffer.from(inputPassword).toString('base64')
  return inputHash === storedHash
}

// POST - Autenticar promotor/ecopunto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log('1. Intento de login:', { username })

    // Validar datos
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: username y password' },
        { status: 400 }
      )
    }

    // Buscar cuenta en la base de datos
    const adminClient = createSupabaseAdminClient()

    console.log('2. Buscando cuenta en la base de datos...')

    const { data: account, error: accountError } = await adminClient
      .from('staff_accounts')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    console.log('3. Resultado de búsqueda:', { account: account?.username, error: accountError })

    if (accountError) {
      console.error('Error al buscar cuenta:', accountError)

      if (accountError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Usuario o contraseña incorrectos' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Error al buscar cuenta' },
        { status: 500 }
      )
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    console.log('4. Verificando contraseña...')
    const passwordValid = verifyPassword(password, account.password_hash)

    if (!passwordValid) {
      console.log('5. Contraseña incorrecta')
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    console.log('6. Autenticación exitosa')

    // Retornar datos de la cuenta (sin el hash de la contraseña)
    return NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      account: {
        id: account.id,
        username: account.username,
        account_type: account.account_type,
        created_at: account.created_at,
      }
    })
  } catch (error) {
    console.error('Error en POST /api/promotor/auth:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
