"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import type { Expense } from '@/types'

interface ExpCat { id: string; name: string; color: string }
interface Props { expenses: Expense[]; categories: ExpCat[] }

export function ExpensesClient({ expenses: initial, categories }: Props) {
  const [expenses, setExpenses] = useState(initial)
  const [form, setForm] = useState({ category_id:'', description:'', vendor:'', amount:'', payment_mode:'cash', expense_date: new Date().toISOString().split('T')[0], notes:'' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { user: authUser } = useAuthStore()
  const isViewer = authUser?.role === 'viewer'

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault()
    if (isViewer) { toast.error('View only access'); return }
    if (!form.description || !form.amount) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('expenses').insert({
        category_id: form.category_id || null,
        description: form.description, vendor: form.vendor || null,
        amount: parseFloat(form.amount), payment_mode: form.payment_mode as any,
        expense_date: form.expense_date, notes: form.notes || null,
      }).select('*, category:expense_categories(*)').single()
      if (error) throw error
      setExpenses(prev => [data as Expense, ...prev])
      setForm(p => ({...p, description:'', vendor:'', amount:'', notes:''}))
      toast.success('Expense added!')
    } catch { toast.error('Failed to add expense') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Expenses" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-[1fr_300px] gap-4">
          {/* List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[16px]">Expense Register</h2>
              <span className="text-[12px] text-ink3">Total: <span className="text-danger font-bold">{formatCurrency(total)}</span></span>
            </div>
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="bg-surface border border-border rounded-md px-4 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: (e.category as any)?.color ?? '#565040' }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{e.description}</div>
                    <div className="text-[11px] text-ink3 mt-0.5">{(e.category as any)?.name ?? 'Uncategorised'} · {e.vendor ?? '—'} · {e.payment_mode} · {e.expense_date}</div>
                  </div>
                  <div className="font-display text-[17px] text-ink whitespace-nowrap">{formatCurrency(e.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="bg-surface border border-border rounded-lg p-4 sticky top-0">
              <h3 className="font-display text-[16px] mb-4">Add Expense</h3>
              <form onSubmit={handleAdd} className="space-y-3">
                <Select label="Category" value={form.category_id} onChange={e => setForm(p=>({...p,category_id:e.target.value}))}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Input label="Description *" placeholder="e.g. Chicken purchase - Halal Mart" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
                <Input label="Vendor" placeholder="Supplier name" value={form.vendor} onChange={e => setForm(p=>({...p,vendor:e.target.value}))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Amount Rs. *" type="number" placeholder="0" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} />
                  <Select label="Payment" value={form.payment_mode} onChange={e => setForm(p=>({...p,payment_mode:e.target.value}))}>
                    <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option>
                  </Select>
                </div>
                <Input label="Date" type="date" value={form.expense_date} onChange={e => setForm(p=>({...p,expense_date:e.target.value}))} />
                <Input label="Notes" placeholder="Optional…" value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} />
                <button type="submit" disabled={saving}
                  className={`w-full py-3 ${isViewer ? 'bg-surface3 text-ink3 cursor-not-allowed' : 'bg-accent text-white hover:bg-accent-light'} text-[#1a1400] rounded-lg font-display text-[15px] hover:bg-accent-light transition-all disabled:opacity-40 mt-1">
                  {saving ? 'Saving…' : 'Add Expense'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
