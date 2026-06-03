import { createClient } from '@/lib/supabase/server'
import { OrderHistoryClient } from './OrderHistoryClient'

export default async function OrderHistoryPage() {
  const supabase = createClient()
  const { data: orders } = await supabase
    .from('orders').select('*, order_items(*)')
    .order('created_at', { ascending: false }).limit(200)
  return <OrderHistoryClient orders={orders ?? []} />
}
