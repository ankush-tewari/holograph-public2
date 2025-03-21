// /src/app/dashboard/page.tsx - this is the REAL User Dashboard page, the one that incorporates 
// \_components\HolographDashboard.tsx where a user sees all of their holographs

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from 'react'
import HolographDashboard from '../_components/HolographDashboard'
import { debugLog } from "../../utils/debug";
import { buttonIcons } from '../../config/icons'; // ✅ Import standardized icons


interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

export default async function Dashboard() {
  // checking if session exists if not redirect to login
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const user = session.user;  // user logged in 

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 bg-gray-50 min-h-screen font-sans">
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome {user?.firstName || 'User'}!
            </h2>
            <p className="text-gray-600 text-lg">Email: {user?.email}</p>
            <div className="flex justify-between items-center mb-6">
          </div>
            {/* Holograph Dashboard */}
            {user && <HolographDashboard userId={user.id} />}
          </div>
        </div>
    </div>
  )
}