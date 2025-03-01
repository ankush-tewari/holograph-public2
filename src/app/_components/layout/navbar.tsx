// /src/app/_components/layout/navbar.tsx

'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { debugLog } from "../../../utils/debug";

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Log session data for debugging
  React.useEffect(() => {
    debugLog("Navbar - Session Status:", status);
    debugLog("Navbar - Session Data:", session);
  }, [session, status]);

  const handleLogout = async () => {
    try {
      // Use NextAuth's signOut instead of custom API
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Determine if user is authenticated
  const isAuthenticated = status === 'authenticated' && session?.user;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Holograph
            </Link>
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/dashboard' 
                      ? 'text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/documents" 
                  className={`ml-4 px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/documents' 
                      ? 'text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Documents
                </Link>
                <div className="ml-4 px-3 py-2 text-sm text-gray-500">
                  {session?.user?.name || session?.user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/login' 
                      ? 'text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}