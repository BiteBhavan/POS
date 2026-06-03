import { createClient } from '@/lib/supabase/server'
import { ExpensesClient } from './ExpensesClient'

export default async function ExpensesPage() {
  const supabase = createClient()
  const [expRes, catRes] = await Promise.all([
    supabase.from('expenses').select('*, category:expense_categories(*)').order('expense_date', {ascending:false}).order('created_at', {ascending:false}).limit(100),
    supabase.from('expense_categories').select('*').order('sort_order'),
  ])
  return <ExpensesClient expenses={expRes.data ?? []} categories={catRes.data ?? []} />
}
