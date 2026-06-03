import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function CustomersPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('saved_addresses').select('*').order('order_count', { ascending: false })
  const addresses = data ?? []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Customers">
        <div className="text-[12px] text-ink3 font-medium">{addresses.length} unique addresses</div>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>{['Address','Customer Name','Phone','Orders','Last Order',''].map(h => (
                  <th key={h} className="text-left text-[10px] text-ink3 uppercase tracking-wider font-semibold px-3 py-2.5 border-b border-border bg-surface2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {addresses.map((a: any) => (
                  <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-surface2 transition-colors">
                    <td className="px-3 py-2.5">
                      <Link href={`/customers/${encodeURIComponent(a.short_code)}`}
                        className="font-bold text-accent text-[13px] hover:underline underline-offset-2">
                        {a.short_code}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/customers/${encodeURIComponent(a.short_code)}`}
                        className="text-[13px] font-medium text-ink hover:text-accent transition-colors">
                        {a.primary_name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-ink2">{a.phone ?? '—'}</td>
                    <td className="px-3 py-2.5 font-bold text-[13px]">{a.order_count}</td>
                    <td className="px-3 py-2.5 text-[11px] text-ink3">
                      {a.last_ordered_at ? format(new Date(a.last_ordered_at), 'd MMM, h:mm a') : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/customers/${encodeURIComponent(a.short_code)}`}
                        className="bg-surface3 border border-border text-ink3 px-2.5 py-1 rounded-md text-[11px] font-medium hover:text-accent hover:border-accent transition-colors">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
