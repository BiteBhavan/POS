import { createClient } from '@/lib/supabase/server'
import { MenuClient } from './MenuClient'

export default async function MenuPage() {
  const supabase = createClient()
  const [itemsRes, catsRes] = await Promise.all([
    supabase.from('menu_items').select('*, category:menu_categories(*)').eq('is_active', true).order('sort_order'),
    supabase.from('menu_categories').select('*').order('sort_order'),
  ])
  return <MenuClient items={itemsRes.data ?? []} categories={catsRes.data ?? []} />
}
