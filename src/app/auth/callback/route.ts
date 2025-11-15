import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
          // El método `setAll` se llamó desde un componente de servidor.
          // Esto se puede ignorar si el middleware actualiza las sesiones de usuario.
            }
          },
        },
      }
    )

    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    // Crear perfil de usuario si no existe (para usuarios nuevos o usuarios OAuth)
    if (sessionData?.user) {
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", sessionData.user.id)
        .single()

      if (!existingProfile) {
       // Obtener el nombre de los metadatos del usuario
       // Para el registro por correo electrónico, el nombre se almacena en user_metadata
       // Para OAuth (Google, etc.), proviene del proveedor
        const name = sessionData.user.user_metadata?.name ||
                    sessionData.user.user_metadata?.full_name ||
                    sessionData.user.email?.split("@")[0] ||
                    "Usuario"

        const { error: insertError } = await supabase.from("users").insert({
          id: sessionData.user.id,
          email: sessionData.user.email!,
          name: name,
          points: 0,
        })

        if (insertError) {
          console.error("Error creating user profile in callback:", insertError)
        }
      }
    }
  }

  // Redirigir al panel de control después de una autenticación exitosa
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
