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
      products: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          price: number
          image_url: string
          category: string
          tags: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          price: number
          image_url: string
          category: string
          tags?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          price?: number
          image_url?: string
          category?: string
          tags?: string[]
        }
      }
      user_products: {
        Row: {
          id: string
          user_id: string
          product_id: string
          purchased_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          purchased_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          purchased_at?: string
        }
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          product_id: string
          message: string
          response: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          message: string
          response: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          message?: string
          response?: string
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 