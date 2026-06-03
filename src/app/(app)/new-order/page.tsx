import { createClient } from '@/lib/supabase/server'
import { NewOrderClient } from './NewOrderClient'
import type { MenuItem, MenuCategory, SavedAddress } from '@/types'

export default async function NewOrderPage() {
  const supabase = createClient()
  const [menuRes, catsRes, addressRes] = await Promise.all([
    supabase.from('menu_items').select('*, category:menu_categories(*)').eq('is_active', true).order('sort_order'),
    supabase.from('menu_categories').select('*').order('sort_order'),
    supabase.from('saved_addresses').select('*').order('order_count', { ascending: false }).limit(50),
  ])
  return (
    <NewOrderClient
      menuItems={menuRes.data as MenuItem[]}
      categories={catsRes.data as MenuCategory[]}
      savedAddresses={addressRes.data as SavedAddress[]}
    />
  )
}
