'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HolographDashboard from '../components/HolographDashboard'

interface User {
  id: string
  email: string
  name: string | null
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch('/api/auth/user')
        if (!res.ok) {
          throw new Error('Not authenticated')
        }
        const data = await res.json()
        setUser(data.user)
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-8">
        {/* User Welcome Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome {user?.name || 'User'}!</h2>
          <p className="text-gray-600">Email: {user?.email}</p>
        </div>

        {/* Holograph Dashboard */}
        {user && <HolographDashboard userId={user.id} />}
      </div>
    </div>
  )
}