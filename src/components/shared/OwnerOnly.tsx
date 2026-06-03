"use client"
import { useAuthStore } from '@/lib/store/auth'

interface Props { children: React.ReactNode; fallback?: React.ReactNode }

export function OwnerOnly({ children, fallback = null }: Props) {
  const { user } = useAuthStore()
  if (user?.role === 'viewer') return <>{fallback}</>
  return <>{children}</>
}

export function useIsViewer() {
  const { user } = useAuthStore()
  return user?.role === 'viewer'
}
