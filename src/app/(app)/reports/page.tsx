import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './ReportsClient'
import { startOfMonth, endOfMonth } from 'date-fns'

export default async function ReportsPage() {
  const supabase = createClient()
  const start = startOfMonth(new Date()).toISOString()
  const end   = endOfMonth(new Date()).toISOString()

  const [ordersRes, expensesRes, settingsRes] = await Promise.all([
    supabase.from('orders').select('source,status,subtotal,discount,total,created_at').gte('created_at', start).lte('created_at', end),
    supabase.from('expenses').select('amount,category:expense_categories(name,color)').gte('expense_date', start.split('T')[0]).lte('expense_date', end.split('T')[0]),
    supabase.from('app_settings').select('zomato_commission_pct,currency_symbol').single(),
  ])
  return <ReportsClient orders={ordersRes.data ?? []} expenses={expensesRes.data ?? []} settings={settingsRes.data} />
}
