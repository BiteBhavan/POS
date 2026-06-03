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
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .single()
      if (profileErr || !profile) {
        toast.error('Username not found')
        return
      }
      const email = username.toLowerCase().trim() + '@bitebhavan.internal'
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        toast.error('Invalid password')
        return
      }
      setUser(profile as User)
      toast.success('Welcome, ' + profile.name)
      const routes: Record<string, string> = {
        owner: '/dashboard',
        counter: '/new-order',
        kitchen: '/order-queue',
        delivery: '/delivery',
      }
      router.push(routes[profile.role] ?? '/dashboard')
    } catch {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-9 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-xl">
            🍔
          </div>
          <span className="font-display text-2xl text-ink">Bite Bhavan</span>
        </div>
        <p className="text-xs text-ink3 mb-6">Cloud Kitchen POS</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink3 uppercase tracking-wider font-semibold">Username</label>
            <input
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-ink text-sm outline-none focus:border-accent placeholder:text-ink4"
              placeholder="azeem"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink3 uppercase tracking-wider font-semibold">Password</label>
            <input
              type="password"
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-ink text-sm outline-none focus:border-accent placeholder:text-ink4"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-accent text-yellow-900 rounded-lg font-display text-base hover:bg-accent-light transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Enter Dashboard'}
          </button>
        </form>
        <p className="text-xs text-ink4 text-center mt-4">Bite Bhavan Kitchen Management</p>
      </div>
    </div>
  )
}
