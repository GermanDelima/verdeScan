"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/supabase/client"
import { Database } from "@/supabase/types"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for ID:", userId)

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      console.log("Profile fetch result:", { data, error })

      if (error) {
        // Si el perfil no existe, puede que aún no se haya creado
        if (error.code === 'PGRST116') {
          // Perfil no encontrado - esto es esperado para usuarios nuevos
          console.log("Perfil de usuario aún no encontrado, se creará en el primer inicio de sesión")
          setUserProfile(null)
        } else {
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          throw error
        }
      } else {
        console.log("User profile loaded successfully:", data)
        setUserProfile(data)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      console.error("Error type:", typeof error)
      console.error("Error stringified:", JSON.stringify(error, null, 2))
      setUserProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  useEffect(() => {
    // Verificar sesiones activas y establecer el usuario
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Escuchar cambios en el estado de autenticación (iniciar sesión, cerrar sesión, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    // Escuchar eventos INSERT en la tabla users (cuando se crea el perfil)
    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log("User profile created:", payload.new)
          setUserProfile(payload.new as UserProfile)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log("User profile updated:", payload.new)
          setUserProfile(payload.new as UserProfile)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}