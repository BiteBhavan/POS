export type UserRole = 'owner' | 'counter' | 'kitchen' | 'delivery'
export type OrderSource = 'direct' | 'zomato' | 'whatsapp'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentMode = 'cash' | 'upi' | 'card' | 'zomato_pay' | 'online'
export type PriceList = 'direct' | 'zomato'

export interface User {
  id: string; auth_id: string; name: string; username: string
  role: UserRole; is_active: boolean; created_at: string; updated_at: string
}
export interface AppSettings {
  id: number; business_name: string; logo_url: string | null
  fssai_number: string | null; gst_number: string | null
  contact_phone: string | null; zomato_commission_pct: number
  printer_ip: string | null; printer_port: number
  currency_symbol: string; updated_at: string
}
export interface MenuCategory { id: string; name: string; slug: string; sort_order: number }
export interface MenuItem {
  id: string; category_id: string | null; name: string; emoji: string
  description: string | null; direct_price: number; zomato_price: number
  is_available: boolean; is_active: boolean; sort_order: number
  created_at: string; updated_at: string; category?: MenuCategory
}
export interface SavedAddress {
  id: string; short_code: string; detail: string | null
  primary_name: string | null; phone: string | null
  order_count: number; last_ordered_at: string | null; created_at: string
}
export interface OrderItem {
  id: string; order_id: string; menu_item_id: string | null
  item_name: string; item_emoji: string | null; quantity: number
  unit_price: number; total_price: number; note: string | null; created_at: string
}
export interface Order {
  id: string; order_number: number; source: OrderSource; status: OrderStatus
  price_list: PriceList; address_short_code: string | null; address_note: string | null
  customer_name: string | null; customer_phone: string | null
  zomato_order_id: string | null; payment_mode: PaymentMode
  subtotal: number; discount: number; total: number
  notes: string | null; created_by: string | null; created_at: string; updated_at: string
  order_items?: OrderItem[]
}
export interface InventoryItem {
  id: string; category_id: string | null; name: string; unit: string
  current_stock: number; reorder_level: number; cost_per_unit: number
  is_active: boolean; created_at: string; updated_at: string
  category?: { id: string; name: string; sort_order: number }
}
export interface Expense {
  id: string; category_id: string | null; description: string; vendor: string | null
  amount: number; payment_mode: PaymentMode; expense_date: string
  notes: string | null; created_by: string | null; created_at: string
  category?: { id: string; name: string; color: string }
}
export interface CartItem {
  menuItemId: string; name: string; emoji: string
  quantity: number; unitPrice: number; note: string
}
