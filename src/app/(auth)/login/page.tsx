"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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
        .eq('username', username.
cd ~/Downloads/bitebhavan-pos
cat > "src/app/(auth)/login/page.tsx" << 'EOF'
"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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

      const email = `${username.toLowerCase().trim()}@bitebhavan.internal`
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (signInErr) {
        toast.error('Invalid password')
        return
      }

      setUser(profile as User)
      toast.success(`Welcome, ${profile.name}!`)

      const routes: Record<string, string> = {
        owner: '/dashboard',
        counter: '/new-order',
        kitchen: '/order-queue',
        delivery: '/delivery',
      }
      router.push(routes[profile.role] ?? '/dashboard')
    } catch (err) {
      toast.error('Login failed, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl p-9 w-full max-w-[360px]">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🍔
          </div>
          <span className="font-display text-[22px] text-ink">Bite Bhavan</span>
        </div>
        <p className="text-[12px] text-ink3 mb-6">Cloud Kitchen POS · app.bitebhavan.com</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <Input
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="azeem"
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="mt-2 w-full justify-center font-display text-base tracking-wide"
          >
            Enter Dashboard
          </Button>
        </form>
        <p className="text-[11px] text-ink4 text-center mt-4">
          Bite Bhavan Kitchen Management System
        </p>
      </div>
    </div>
  )
}
