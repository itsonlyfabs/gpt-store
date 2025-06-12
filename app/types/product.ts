export interface Product {
  id: string
  name: string
  description: string
  expertise: string
  personality: string
  style: string
  assistant_id?: string
  created_at?: string
  updated_at?: string
  prompt?: string
}

export interface Bundle {
  id: string
  name: string
  description: string
  products: Product[]
  productsCount?: number
  created_at?: string
  updated_at?: string
} 