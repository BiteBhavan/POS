"use client"
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { Download } from 'lucide-react'

interface Props {
  orders: any[]; expenses: any[]
  settings: { zomato_commission_pct: number; currency_symbol: string } | null
}

export function ReportsClient({ orders, expenses, settings }: Props) {
  const sym    = settings?.currency_symbol ?? 'Rs.'
  const commPct = settings?.zomato_commission_pct ?? 31

  const activeOrders    = orders.filter(o => o.status !== 'cancelled')
  const directRevenue   = activeOrders.filter(o => o.source === 'direct').reduce((s,o) => s+o.total, 0)
  const zomatoRevenue   = activeOrders.filter(o => o.source === 'zomato').reduce((s,o) => s+o.total, 0)
  const commission      = (zomatoRevenue * commPct) / 100
  const netRevenue      = directRevenue + zomatoRevenue - commission
  const totalExpenses   = expenses.reduce((s: number, e: any) => s + e.amount, 0)
  const netProfit       = netRevenue - totalExpenses

  const expByCategory = expenses.reduce((acc: any, e: any) => {
    const name = e.category?.name ?? 'Other'
    acc[name] = (acc[name] ?? 0) + e.amount
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Reports">
        <Button variant="ghost" size="sm">📅 Date Range</Button>
        <Button variant="primary" size="sm" icon={<Download size={13}/>}>Export PDF</Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Gross Revenue"       value={formatCurrency(directRevenue + zomatoRevenue, sym)} accent="gold"  icon="💰" />
          <StatCard label="Total Expenses"      value={formatCurrency(totalExpenses, sym)} accent="red"  icon="💸" />
          <StatCard label="Net Profit"          value={formatCurrency(netProfit, sym)} sub={`${Math.round(netProfit/(netRevenue||1)*100)}% margin`} accent="green" icon="📈" />
          <StatCard label="Zomato Commission"   value={formatCurrency(Math.round(commission), sym)} sub={`${commPct}% on ${formatCurrency(zomatoRevenue, sym)}`} accent="red" icon="📉" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* P&L */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="font-display text-[15px] mb-4">P&L Statement — This Month</h3>
            {[
              ['Direct Sales', directRevenue, true],
              ['Zomato Gross Sales', zomatoRevenue, true],
              [`Zomato Commission (${commPct}%)`, -commission, false],
              ['Net Revenue', netRevenue, null],
              ...Object.entries(expByCategory).map(([k,v]) => [k, -(v as number), false]),
            ].map(([label, amount, isPos], i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-b-0 text-[13px]">
                <span className="text-ink2">{label as string}</span>
                <span className={isPos === true ? 'text-success font-semibold' : isPos === false ? 'text-danger font-semibold' : 'font-bold text-ink'}>
                  {(amount as number) < 0 ? `−${formatCurrency(Math.abs(amount as number), sym)}` : formatCurrency(amount as number, sym)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 font-bold text-[15px]">
              <span>Net Profit</span>
              <span className="font-display text-[22px] text-accent">{formatCurrency(netProfit, sym)}</span>
            </div>
          </div>

          {/* Zomato Reconciliation */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="font-display text-[15px] mb-4">Zomato Reconciliation</h3>
            <div className="space-y-3 text-[13px]">
              {[['Gross Sales', zomatoRevenue], [`Commission (${commPct}%)`, -commission], ['Net Payout', zomatoRevenue - commission]].map(([label, val]) => (
                <div key={label as string} className="flex justify-between py-2 border-b border-border">
                  <span className="text-ink2">{label}</span>
                  <span className={(val as number) < 0 ? 'text-danger font-semibold' : 'font-semibold'}>
                    {(val as number) < 0 ? `−${formatCurrency(Math.abs(val as number), sym)}` : formatCurrency(val as number, sym)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-surface2 rounded-md text-[12px] text-ink3">
              <strong className="text-ink">Note:</strong> Zomato payouts typically take 7–10 business days. Verify against Zomato Partner dashboard.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
