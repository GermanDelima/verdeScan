export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          points: number
          total_earned_points: number
          neighborhood: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          points?: number
          total_earned_points?: number
          neighborhood?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          points?: number
          total_earned_points?: number
          neighborhood?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      staff_accounts: {
        Row: {
          id: string
          username: string
          password_hash: string
          account_type: 'promotor' | 'ecopunto'
          created_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          account_type: 'promotor' | 'ecopunto'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          account_type?: 'promotor' | 'ecopunto'
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      scans: {
        Row: {
          id: string
          user_id: string
          qr_code: string
          points_earned: number
          material_details: string | null
          scanned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          qr_code: string
          points_earned: number
          material_details?: string | null
          scanned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          qr_code?: string
          points_earned?: number
          material_details?: string | null
          scanned_at?: string
        }
      }
      raffles: {
        Row: {
          id: string
          title: string
          description: string
          prize: string
          ticket_cost: number
          draw_date: string
          status: string
          category: string | null
          sponsor: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          prize: string
          ticket_cost?: number
          draw_date: string
          status?: string
          category?: string | null
          sponsor?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          prize?: string
          ticket_cost?: number
          draw_date?: string
          status?: string
          category?: string | null
          sponsor?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      raffle_tickets: {
        Row: {
          id: string
          user_id: string
          raffle_id: string
          ticket_number: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          raffle_id: string
          ticket_number: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          raffle_id?: string
          ticket_number?: string
          created_at?: string
        }
      }
      recycling_tokens: {
        Row: {
          id: string
          user_id: string
          token_code: string
          material_type: 'avu' | 'lata' | 'botella'
          points_value: number
          quantity: number
          status: 'pending' | 'validated' | 'expired' | 'cancelled'
          created_at: string
          expires_at: string
          validated_at: string | null
          validated_by: string | null
          validation_location: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token_code: string
          material_type: 'avu' | 'lata' | 'botella'
          points_value: number
          quantity?: number
          status?: 'pending' | 'validated' | 'expired' | 'cancelled'
          created_at?: string
          expires_at: string
          validated_at?: string | null
          validated_by?: string | null
          validation_location?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token_code?: string
          material_type?: 'avu' | 'lata' | 'botella'
          points_value?: number
          quantity?: number
          status?: 'pending' | 'validated' | 'expired' | 'cancelled'
          created_at?: string
          expires_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_location?: string | null
        }
      }
      material_points_config: {
        Row: {
          material_type: 'avu' | 'lata' | 'botella'
          points_per_unit: number
          unit_description: string
          updated_at: string
        }
        Insert: {
          material_type: 'avu' | 'lata' | 'botella'
          points_per_unit: number
          unit_description: string
          updated_at?: string
        }
        Update: {
          material_type?: 'avu' | 'lata' | 'botella'
          points_per_unit?: number
          unit_description?: string
          updated_at?: string
        }
      }
      user_virtual_bin: {
        Row: {
          id: string
          user_id: string
          material_type: 'avu' | 'lata' | 'botella'
          quantity: number
          last_scanned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          material_type: 'avu' | 'lata' | 'botella'
          quantity?: number
          last_scanned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          material_type?: 'avu' | 'lata' | 'botella'
          quantity?: number
          last_scanned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
