// /src/app/dashboard/page.tsx - this is the REAL Dashboard page, the one that incorporates 
// \_components\HolographDashboard.tsx

'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'; // ✅ Ensure X is imported
import { useRouter } from 'next/navigation'
import HolographDashboard from '../_components/HolographDashboard'
import { debugLog } from "../../utils/debug";
import CreateHolograph from '../_components/holograph/CreateHolograph';


interface User {
  id: string
  email: string
  name: string | null
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // ✅ Add refresh state


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
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
               + Create New Holograph
            </button>
            <p className="text-gray-600 text-lg">Email: {user?.email}</p>
            <div className="flex justify-between items-center mb-6">
            
          </div>
          

            {/* Remove or update session debug info if not using session 
            <pre className="bg-gray-100 p-2">User ID: /src/app/dashboard/page.tsx {user?.id}</pre>
            */}

            {/* ✅ Debug: Show session details on the page */}
            {/* <pre className="bg-gray-100 p-2">Session in holograph landing page={JSON.stringify(session, null, 2)}</pre>*/}
            
            {/* ✅ Place CreateHolograph Modal Here */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                  >
                    <X size={20} />
                  </button>
                  <CreateHolograph
                    userId={user?.id}
                    onSuccess={(createdHolograph) => { // ✅ Fix: Use correct variable name
                      debugLog("✅ Dashboard received new Holograph:", createdHolograph);
                      setShowCreateForm(false);
                      setRefreshKey(prevKey => prevKey + 1); // ✅ Force refresh
                      router.refresh(); // ✅ Force UI update
                    }}
                  />
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Holograph Dashboard */}
            {user && <HolographDashboard userId={user.id} />}
            
          </div>
        </div>
    </div>
  )
}