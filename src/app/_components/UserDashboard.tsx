// src/app/_components/UserDashboard.tsx - this is the main user dashboard - shows ALL Holographs for a user

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
  firstName: string | null;
  lastName: string | null;
}

interface Holograph {
  id: string;
  title: string;
  updatedAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}


interface Invitation {
  id: string;
  holographId: string;
  role: string;
  inviterId: string;
  status: string;  
  holographTitle?: string;
  inviterFirstName?: string;
  inviterLastName?: string;
}

interface RemovalRequest {
  id: string;
  holographId: string;
  holographTitle: string;
  requestedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}


const UserDashboard = () => {
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
  const [removalRequests, setRemovalRequests] = useState([]);

  

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

  // fetch removal requests
  const fetchRemovalRequests = async () => {
    try {
      const response = await fetch(`/api/holograph/principal-removal-requests`);
      if (!response.ok) throw new Error("Failed to fetch removal requests");
      const data = await response.json();
      setRemovalRequests(data);
    } catch (error) {
      console.error("❌ Error fetching removal requests:", error);
    }
  };

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
            owner: holo.owner
              ? {
                  id: holo.owner.id,
                  name: `${holo.owner.firstName} ${holo.owner.lastName}`,
                }
              : { id: "unknown", name: "Unknown" },
          })),
          delegated: delegatedData.map((holo: Holograph) => ({
            ...holo,
            owner: holo.owner
              ? {
                  id: holo.owner.id,
                  name: `${holo.owner.firstName} ${holo.owner.lastName}`,
                }
              : { id: "unknown", name: "Unknown" },
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
        const response = await fetch(`/api/invitations?userId=${userId}`);
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
    fetchRemovalRequests();
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
        method: 'PATCH',
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
        method: 'PATCH',
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

  const handleRemovalResponse = async (removalId, holographId, action) => {
    const confirmMsg = action === "accept"
      ? "Accept removal and lose access to this Holograph?"
      : "Decline and remain a Principal?";
    if (!window.confirm(confirmMsg)) return;
  
    try {
      const response = await fetch(`/api/holograph/${holographId}/principals/remove/${removalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
  
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        fetchRemovalRequests(); // Refresh list
        router.refresh(); // Ensure access updates
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Error responding to removal:", err);
      alert("Failed to process request.");
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

  
  const pendingInvitations = invitations.filter(invite => invite.status === "Pending");

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
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} /> Create New Holograph
              </button>
            </div>

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
                🤝 Delegated to Me
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'messages' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📩 Messages
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

                {activeTab === 'delegated' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {holographs.delegated.length > 0 ? (
                      holographs.delegated.map(holograph => (
                        <div 
                          key={holograph.id} 
                          className="holograph-item cursor-pointer"
                          onClick={() => router.push(`/holographs/${holograph.id}`)}
                        >
                          <h3 className="text-lg font-semibold text-green-700">🤝 {holograph.title}</h3>
                          <p className="text-sm text-gray-600">Delegated On: {holograph.assignedAt ? format(new Date(holograph.assignedAt), "MMM d, yyyy") : "Unknown"}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No delegated Holographs found.</p>
                    )}
                  </div>
                )}

                {activeTab === 'messages' && (
                  <div className="grid gap-4 md:grid-cols-1">
                    {/* Invitations Section */}
                    <h3 className="text-lg font-semibold">Invitations</h3>
                    {pendingInvitations.length > 0 ? (
                      pendingInvitations.map(invitation => (
                        <div key={invitation.id} className="holograph-item flex justify-between items-center">
                          <span>
                            Invitation to "{invitation.holographTitle}" as {invitation.role} by {invitation.inviterFirstName} {invitation.inviterLastName}
                          </span>
                          <div className='flex gap-2'>
                            <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              onClick={() => handleAcceptInvite(invitation.id, invitation.holographId)}>
                              Accept
                            </button>
                            <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              onClick={() => handleDeclineInvite(invitation.id)}>
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No pending invitations.</p>
                    )}

                    {/* Principal Removal Requests Section */}
                    <h3 className="text-lg font-semibold mt-6">Principal Removal Requests</h3>
                    {removalRequests.length > 0 ? (
                      removalRequests.map(req => (
                        <div key={req.id} className="holograph-item flex justify-between items-center">
                          <span>
                            You are being removed from "{req.holographTitle}" by {req.requestedBy.firstName} {req.requestedBy.lastName}
                          </span>
                          <div className='flex gap-2'>
                            <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              onClick={() => handleRemovalResponse(req.id, req.holographId, "accept")}>
                              Accept
                            </button>
                            <button className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                              onClick={() => handleRemovalResponse(req.id, req.holographId, "decline")}>
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No pending removal requests.</p>
                    )}
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

export default UserDashboard;
