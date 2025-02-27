// src/app/_components/HolographDashboard.tsx - this is the main user dashboard

"use client"; // ✅ Ensures `useRouter` works in Next.js App Router

import React, { useState, useEffect } from 'react';
import { Plus, Share2, X } from 'lucide-react';
import Link from 'next/link';
import CreateHolograph from './holograph/CreateHolograph'; //testing auto change to holograph-public
import { useRouter } from 'next/navigation'; // Import Next.js router

// Define types for our data
interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Holograph {
  id: string;
  title: string;
  lastModified: string;
  owner?: { id: string; name: string | null };
}

interface DashboardProps {
  userId?: string; // ✅ Optional, since we'll fetch it manually
}

interface Invitation {
  id: string;
  holographId: string;
  role: string;
  inviterId: string;
  holographTitle?: string;
  inviterName?: string;
}


const HolographDashboard = ({ userId }: DashboardProps) => {
  const router = useRouter(); // Initialize router
  const [user, setUser] = useState<User | null>(null); // ✅ Define `user` state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('owned');
  const [holographs, setHolographs] = useState<{
    owned: Holograph[];
    delegated: Holograph[];
  }>({
    owned: [],
    delegated: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);


  // ✅ Fetch user data (Runs once when component mounts)
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("❌ Failed to fetch user session:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    if (!userId) {
      loadUserData();
    }
  }, [userId, router]); // ✅ Properly closes `useEffect`

  // ✅ Fetch Holographs & Invitations AFTER userId is set
  useEffect(() => {
    if (!userId) return; // ✅ Prevent running if userId is not ready

    const fetchHolographs = async () => {
      try {
        setIsLoading(true);
        const ownedResponse = await fetch(`/api/holograph/principals?userId=${userId}`);
        let ownedData = ownedResponse.ok ? await ownedResponse.json() : [];
        const delegatedResponse = await fetch(`/api/holograph/delegates?userId=${userId}`);
        let delegatedData = delegatedResponse.ok ? await delegatedResponse.json() : [];

        setHolographs({
          owned: ownedData.map((holo: Holograph) => ({
            ...holo,
            owner: holo.owner ? { id: holo.owner.id, name: holo.owner.name ?? "Unknown" } : { id: "unknown", name: "Unknown" },
          })),
          delegated: delegatedData.map((holo: Holograph) => ({
            ...holo,
            owner: holo.owner ? { id: holo.owner.id, name: holo.owner.name ?? "Unknown" } : { id: "unknown", name: "Unknown" },
          })),
        });
      } catch (err) {
        setError("Failed to load holographs. Please try again later.");
        console.error("Error fetching holographs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchInvitations = async () => {
      console.log("🔍 Fetching invitations for user:", userId);
      try {
        const response = await fetch(`/api/invitations/user/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch invitations");

        let invitationsData = await response.json();
        setInvitations(invitationsData);
      } catch (error) {
        console.error("❌ Error fetching invitations:", error);
      }
    };

    fetchHolographs();
    fetchInvitations();
  }, [userId]); // ✅ This now correctly belongs to its own `useEffect`

  const handleCreateSuccess = async (newHolograph: Holograph): Promise<void> => {
    console.log("🔍 handleCreateSuccess is being executed...");
    console.log(`✅ Created new Holograph: ${newHolograph.title}`);
  
    console.log("🚀 Redirecting to dashboard...");
    router.push("/dashboard"); // ✅ Immediate redirect
    router.refresh(); // ✅ Ensure UI updates after navigation
  };

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {showCreateForm ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-2xl bg-white rounded-lg">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
            <CreateHolograph 
              userId={userId}
              onSuccess={handleCreateSuccess}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Holographs</h1>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create New
            </button>

           {/* Remove or update session debug info if not using session */}
           {/*} <pre className="bg-gray-100 p-2">User ID: {user?.id}</pre> */}


          </div>

          <div className="w-full">
  {/* Tab buttons */}
  <div className="flex gap-4 border-b mb-6">
    <button
      onClick={() => setActiveTab('owned')}
      className={`px-4 py-2 font-medium ${
        activeTab === 'owned'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      📜 My Holographs
    </button>
    <button
      onClick={() => setActiveTab('delegated')}
      className={`px-4 py-2 font-medium ${
        activeTab === 'delegated'
          ? 'text-green-600 border-b-2 border-green-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      🤝 Shared with Me
    </button>
  </div>

  {/* Loading state */}
  {isLoading ? (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ) : (
    <>
      {/* Owned Holographs */}
      {activeTab === 'owned' && (
        <div className="grid gap-4 md:grid-cols-2">
          {holographs.owned.map(holograph => (
            <div key={holograph.id} className="bg-blue-50 rounded-lg border border-blue-300 p-4 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-blue-700">
                <Link href={`/holographs/${holograph.id}`}>📜 {holograph.title}</Link>
              </h3>
              <p className="text-sm text-gray-600">Last modified: {new Date(holograph.lastModified).toLocaleDateString()}</p>
            </div>
          ))}

          {/* ✅ Debug: Show session details on the page */}
        {/* <pre className="bg-gray-100 p-2">Session in holograph landing page={JSON.stringify(session, null, 2)}</pre> */}
        {/* Remove or update session debug info if not using session */}
        <pre className="bg-gray-100 p-2">User ID: src/app/_components/HolographDashboard.tsx {userId}</pre>
        </div>
      )}

      {/* Delegated Holographs */}
      {activeTab === 'delegated' && (
        <div className="grid gap-4 md:grid-cols-2">
          {holographs.delegated.map(holograph => {
            console.log("📋 Holograph Data:", holograph); // ✅ Debugging log
            
            return (
              <div key={holograph.id} className="bg-green-50 rounded-lg border border-green-300 p-4 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-green-700">
                  <Link href={`/holographs/${holograph.id}`}>🤝 {holograph.title}</Link>
                </h3>
                <p className="text-sm text-gray-600">Shared by {holograph.owner?.name ?? "Unknown User"}</p>
                <p className="text-sm text-gray-600">Last modified: {new Date(holograph.lastModified).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Pending Invitations</h2>
          {invitations.map((invite) => (
            <div key={invite.id} className="flex justify-between items-center p-3 border-b">
              <p className="text-gray-700">
                Invitation to join <strong>{invite.holographTitle}</strong> by <strong>{invite.inviterName}</strong> as a <strong>{invite.role}</strong>
              </p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => handleAcceptInvite(invite.id, invite.holographId)}
                >
                  Accept
                </button>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => handleDeclineInvite(invite.id)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </>
  )}
</div>
{/* remnant? */}
        </>
      )}
    </div>
  );
};

export default HolographDashboard;