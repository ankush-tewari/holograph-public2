// src/app/_components/HolographDashboard.tsx - this is the main user dashboard

"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Share2, X } from 'lucide-react';
import Link from 'next/link';
import CreateHolograph from './holograph/CreateHolograph';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useHolograph } from '../../hooks/useHolograph';
import { format } from "date-fns";
import { debugLog } from "../../utils/debug";

// Define types for our data
interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Holograph {
  id: string;
  title: string;
  updatedAt: string;
  owner?: { id: string; name: string | null };
}

interface Invitation {
  id: string;
  holographId: string;
  role: string;
  inviterId: string;
  holographTitle?: string;
  inviterName?: string;
}

const HolographDashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setCurrentHolographId } = useHolograph();
  
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

  // Log session status for debugging
  useEffect(() => {
    debugLog("🔍 Auth Status: debuglog",status);
    debugLog("🔍 Session: debuglog", session);

  }, [status, session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      debugLog("⚠️ User not authenticated, redirecting to login");
      router.push('/login');
    }
  }, [status, router]);

  // Fetch Holographs & Invitations after authentication
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    const userId = session.user.id;
    debugLog("✅ User authenticated with ID:", userId);

    const fetchHolographs = async () => {
      try {
        setIsLoading(true);
        debugLog("🔍 Fetching holographs for user:", userId);
        
        const ownedResponse = await fetch(`/api/holograph/principals`);
        const delegatedResponse = await fetch(`/api/holograph/delegates`);
        
        if (!ownedResponse.ok || !delegatedResponse.ok) {
          throw new Error("Failed to fetch holographs");
        }
        
        let ownedData = await ownedResponse.json();
        let delegatedData = await delegatedResponse.json();

        debugLog("✅ Fetched data - Owned:", ownedData.length, "Delegated:", delegatedData.length);

        setHolographs({
          owned: ownedData.map((holo: Holograph) => ({
            ...holo,
            lastModified: holo.updatedAt, // ✅ Ensure lastModified is assigned from updatedAt
            owner: holo.owner ? { id: holo.owner.id, name: holo.owner.name ?? "Unknown" } : { id: "unknown", name: "Unknown" },
          })),
          delegated: delegatedData.map((holo: Holograph) => ({
            ...holo,
            lastModified: holo.updatedAt, // ✅ Ensure lastModified is assigned from updatedAt
            owner: holo.owner ? { id: holo.owner.id, name: holo.owner.name ?? "Unknown" } : { id: "unknown", name: "Unknown" },
          })),
        });

        if (holographs.owned.length > 0 || holographs.delegated.length > 0) {
          debugLog("📡 Owned Holographs:", holographs.owned);
          debugLog("📡 Delegated Holographs:", holographs.delegated);
      
          holographs.owned.forEach(holo => debugLog(`📅 Owned Holograph - ${holo.title}:`, holo.updatedAt));
          holographs.delegated.forEach(holo => debugLog(`📅 Delegated Holograph - ${holo.title}:`, holo.updatedAt));
        }
      } catch (err) {
        console.error("❌ Error fetching holographs:", err);
        setError("Failed to load holographs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchInvitations = async () => {
      debugLog("🔍 Fetching invitations for user:", userId);
      try {
        const response = await fetch(`/api/invitations/user/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch invitations");

        let invitationsData = await response.json();
        debugLog("✅ Fetched invitations:", invitationsData.length);
        setInvitations(invitationsData);
      } catch (error) {
        console.error("❌ Error fetching invitations:", error);
      }
    };

    fetchHolographs();
    fetchInvitations();
  }, [status, session, router]);

  const handleCreateSuccess = async (newHolograph: Holograph): Promise<void> => {
    debugLog("🔍 handleCreateSuccess is being executed...");
    debugLog(`✅ Created new Holograph: ${newHolograph.title}`);
  
    debugLog("🚀 Redirecting to dashboard...");
    router.push("/dashboard");
    router.refresh();
  };

  // Handle accepting invitation
  const handleAcceptInvite = async (inviteId: string, holographId: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Accepted' }),
      });

      if (response.ok) {
        setInvitations(prev => prev.filter(invite => invite.id !== inviteId));
        // Refresh the holographs list
        router.refresh();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  // Handle declining invitation
  const handleDeclineInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Declined' }),
      });

      if (response.ok) {
        setInvitations(prev => prev.filter(invite => invite.id !== inviteId));
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  // Handle clicking on a holograph - update the current holograph ID in the session
  const handleHolographClick = async (holographId: string) => {
    debugLog("🔍 Clicking on holograph:", holographId);
    
    // Set the current holograph ID in the session
    await setCurrentHolographId(holographId);
    
    // Navigate to the holograph page
    router.push(`/holographs/${holographId}`);
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
              className="btn-secondary absolute right-4 top-4 p-2"
            >
              <X size={20} />
            </button>
            <CreateHolograph 
              userId={session?.user?.id}
              onSuccess={() => router.refresh()}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Holographs</h1>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Create New
            </button>
          </div>

          <div className="w-full">
            <div className="flex gap-4 border-b mb-6">
              <button
                onClick={() => setActiveTab('owned')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'owned' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📜 My Holographs
              </button>
              <button
                onClick={() => setActiveTab('delegated')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'delegated' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🤝 Shared with Me
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'owned' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {holographs.owned.map(holograph => (
                      <div 
                        key={holograph.id} 
                        className="holograph-item cursor-pointer"
                        onClick={() => router.push(`/holographs/${holograph.id}`)}
                      >
                        <h3 className="text-lg font-semibold text-blue-700">📜 {holograph.title}</h3>
                        <p className="text-sm text-gray-600">Last modified: {format(new Date(holograph.updatedAt), "MMM d, yyyy")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HolographDashboard;
