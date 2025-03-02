// /src/app/dashboard/page.tsx - this is the REAL Dashboard page, the one that incorporates 
// \_components\HolographDashboard.tsx

'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HolographDashboard from '../_components/HolographDashboard'
import { debugLog } from "../../utils/debug";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 bg-gray-50 min-h-screen font-sans">
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome {user?.name || 'User'}!
            </h2>
            <p className="text-gray-600 text-lg">Email: {user?.email}</p>

            {/* Remove or update session debug info if not using session 
            <pre className="bg-gray-100 p-2">User ID: /src/app/dashboard/page.tsx {user?.id}</pre>
            */}

            {/* ✅ Debug: Show session details on the page */}
            {/* <pre className="bg-gray-100 p-2">Session in holograph landing page={JSON.stringify(session, null, 2)}</pre>*/}
            
            {/* Holograph Dashboard */}
            {user && <HolographDashboard userId={user.id} />}
          </div>
        </div>
    </div>
  )
}