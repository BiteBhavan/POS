"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import toast from 'react-hot-toast'
import type { User } from '@/types'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setUser = useAuthStore(s => s.setUser)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('users').select('*').eq('username', username.toLowerCase().trim()).single()
      if (profileErr || !profile) { toast.error('Username not found'); return }
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: username.toLowerCase().trim() + '@bitebhavan.internal', password
      })
      if (signInErr) { toast.error('Invalid password'); return }
      setUser(profile as User)
      toast.success('Welcome, ' + profile.name + '!')
      router.push({ owner:'/dashboard', counter:'/new-order', kitchen:'/order-queue', delivery:'/delivery' }[profile.role as string] ?? '/dashboard')
    } catch { toast.error('Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#1a3a5c] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">🍔</div>
          <h1 className="text-2xl font-bold text-white">Bite Bhavan</h1>
          <p className="text-white/50 text-sm mt-1">Cloud Kitchen Management</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-7">
          <h2 className="text-[15px] font-semibold text-ink mb-5">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-ink2 uppercase tracking-wider mb-1.5">Username</label>
              <input className="w-full border border-border rounded-lg px-3 py-2.5 text-[14px] text-ink outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-ink4"
                placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink2 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" className="w-full border border-border rounded-lg px-3 py-2.5 text-[14px] text-ink outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-ink4"
                placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-accent text-white rounded-lg font-semibold text-[14px] hover:bg-accent-light transition-all shadow-sm disabled:opacity-50 mt-1">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-white/30 mt-5">app.bitebhavan.com · v1.0</p>
      </div>
    </div>
  )
}
