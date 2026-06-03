"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/layout/Topbar'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/auth'
import type { Expense, PaymentMode } from '@/types'

interface ExpCat { id: string; name: string; color: string }
interface Props { expenses: Expense[]; categories: ExpCat[] }

export function ExpensesClient({ expenses: initial, categories }: Props) {
  const [expenses, setExpenses] = useState(initial)
  const [form, setForm] = useState({ category_id:'', description:'', vendor:'', amount:'', payment_mode:'cash', expense_date: new Date().toISOString().split('T')[0], notes:'' })
  const [saving, setSaving] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)
  const supabase = createClient()
  const { user } = useAuthStore()
  const isViewer = user?.role === 'viewer'

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.description || !form.amount) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('expenses').insert({
        category_id: form.category_id || null, description: form.description,
        vendor: form.vendor || null, amount: parseFloat(form.amount),
        payment_mode: form.payment_mode as PaymentMode,
        expense_date: form.expense_date, notes: form.notes || null,
      }).select('*, category:expense_categories(*)').single()
      if (error) throw error
      setExpenses(prev => [data as Expense, ...prev])
      setForm(p => ({...p, description:'', vendor:'', amount:'', notes:''}))
      toast.success('Expense added!')
    } catch { toast.error('Failed to add expense') }
    finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!editExpense) return
    try {
      const { error } = await supabase.from('expenses').update({
        category_id: editExpense.category_id,
        description: editExpense.description,
        vendor: editExpense.vendor,
        amount: editExpense.amount,
        payment_mode: editExpense.payment_mode,
        expense_date: editExpense.expense_date,
        notes: editExpense.notes,
      }).eq('id', editExpense.id)
      if (error) throw error
      setExpenses(prev => prev.map(e => e.id === editExpense.id ? editExpense : e))
      toast.success('Expense updated!')
      setEditExpense(null)
    } catch { toast.error('Update failed') }
  }

  async function handleDelete() {
    if (!deleteExpense) return
    try {
      await supabase.from('expenses').delete().eq('id', deleteExpense.id)
      setExpenses(prev => prev.filter(e => e.id !== deleteExpense.id))
      toast.success('Expense deleted')
      setDeleteExpense(null)
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Expenses"/>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
          {/* List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-ink">Expense Register</h2>
              <span className="text-[12px] text-ink3">Total: <span className="text-danger font-bold">{formatCurrency(total)}</span></span>
            </div>
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="bg-white border border-border rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: (e.category as any)?.color ?? '#565040' }}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink">{e.description}</div>
                    <div className="text-[11px] text-ink3 mt-0.5">{(e.category as any)?.name ?? 'Uncategorised'} · {e.vendor ?? '—'} · {e.payment_mode} · {e.expense_date}</div>
                  </div>
                  <div className="font-bold text-[15px] text-ink whitespace-nowrap">{formatCurrency(e.amount)}</div>
                  {!isViewer && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditExpense({...e})} className="p-1.5 rounded text-ink3 hover:text-accent hover:bg-accent/10 transition-all"><Pencil size={13}/></button>
                      <button onClick={() => setDeleteExpense(e)} className="p-1.5 rounded text-ink3 hover:text-danger hover:bg-danger/10 transition-all"><Trash2 size={13}/></button>
                    </div>
                  )}
                </div>
              ))}
              {expenses.length === 0 && <div className="text-center py-10 text-ink3 text-sm">No expenses recorded</div>}
            </div>
          </div>

          {/* Add form */}
          {!isViewer && (
            <div>
              <div className="bg-white border border-border rounded-lg p-4 sticky top-0 shadow-sm">
                <h3 className="text-[15px] font-bold text-ink mb-4">Add Expense</h3>
                <form onSubmit={handleAdd} className="space-y-3">
                  <Select label="Category" value={form.category_id} onChange={e => setForm(p=>({...p,category_id:e.target.value}))}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Input label="Description *" placeholder="e.g. Chicken purchase" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}/>
                  <Input label="Vendor" placeholder="Supplier name" value={form.vendor} onChange={e => setForm(p=>({...p,vendor:e.target.value}))}/>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Amount Rs. *" type="number" placeholder="0" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))}/>
                    <Select label="Payment" value={form.payment_mode} onChange={e => setForm(p=>({...p,payment_mode:e.target.value}))}>
                      <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option>
                    </Select>
                  </div>
                  <Input label="Date" type="date" value={form.expense_date} onChange={e => setForm(p=>({...p,expense_date:e.target.value}))}/>
                  <button type="submit" disabled={saving}
                    className="w-full py-3 bg-accent text-white rounded-lg font-semibold text-[14px] hover:bg-accent-light transition-all disabled:opacity-40 mt-1">
                    {saving ? 'Saving…' : 'Add Expense'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT EXPENSE MODAL */}
      <Modal open={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Expense"
        footer={<><Button variant="ghost" onClick={() => setEditExpense(null)}>Cancel</Button><Button variant="primary" onClick={handleEdit}>Save</Button></>}>
        {editExpense && (
          <div className="space-y-3">
            <Select label="Category" value={editExpense.category_id ?? ''} onChange={e => setEditExpense(p => p ? {...p, category_id: e.target.value} : p)}>
              <option value="">Select…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Description" value={editExpense.description} onChange={e => setEditExpense(p => p ? {...p, description: e.target.value} : p)}/>
            <Input label="Vendor" value={editExpense.vendor ?? ''} onChange={e => setEditExpense(p => p ? {...p, vendor: e.target.value} : p)}/>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount Rs." type="number" value={editExpense.amount} onChange={e => setEditExpense(p => p ? {...p, amount: Number(e.target.value)} : p)}/>
              <Select label="Payment" value={editExpense.payment_mode} onChange={e => setEditExpense(p => p ? {...p, payment_mode: e.target.value as PaymentMode} : p)}>
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option>
              </Select>
            </div>
            <Input label="Date" type="date" value={editExpense.expense_date} onChange={e => setEditExpense(p => p ? {...p, expense_date: e.target.value} : p)}/>
          </div>
        )}
      </Modal>

      {/* DELETE EXPENSE MODAL */}
      <Modal open={!!deleteExpense} onClose={() => setDeleteExpense(null)} title="Delete Expense"
        footer={<><Button variant="ghost" onClick={() => setDeleteExpense(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Yes, Delete</Button></>}>
        {deleteExpense && (
          <div>
            <p className="text-[14px] text-ink mb-3">Delete this expense?</p>
            <div className="bg-surface2 border border-border rounded-lg p-3 text-[12px] space-y-1">
              <div><span className="text-ink3">Description: </span><strong>{deleteExpense.description}</strong></div>
              <div><span className="text-ink3">Amount: </span><strong className="text-danger">{formatCurrency(deleteExpense.amount)}</strong></div>
              <div><span className="text-ink3">Date: </span>{deleteExpense.expense_date}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
