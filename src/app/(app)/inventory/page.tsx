import { createClient } from '@/lib/supabase/server'
import { InventoryClient } from './InventoryClient'

export default async function InventoryPage() {
  const supabase = createClient()
  const [itemsRes, catsRes] = await Promise.all([
    supabase.from('inventory_items').select('*, category:inventory_categories(*)').eq('is_active', true).order('name'),
    supabase.from('inventory_categories').select('*').order('sort_order'),
  ])
  return <InventoryClient items={itemsRes.data ?? []} categories={catsRes.data ?? []} />
}
