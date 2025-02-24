// src/app/components/HolographDashboard.tsx
"use client"; // ✅ Ensures `useRouter` works in Next.js App Router

import React, { useState, useEffect } from 'react';
import { Plus, Share2, X } from 'lucide-react';
import Link from 'next/link';
import CreateHolograph from './holograph/CreateHolograph'; //testing auto change to holograph-public
import { useRouter } from 'next/navigation'; // Import Next.js router

// Define types for our data
interface Holograph {
  id: string;
  title: string;
  lastModified: string;
  owner?: { id: string; name: string | null };
}

interface DashboardProps {
  userId: string;
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



  const handleAcceptInvite = async (inviteId: string, holographId: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Accepted', holographId, userId }),
      });
  
      if (response.ok) {
        setInvitations(invitations.filter(invite => invite.id !== inviteId));
      } else {
        console.error('Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };
  
  const handleDeclineInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/invitations/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Declined' }),
      });
  
      if (response.ok) {
        setInvitations(invitations.filter(invite => invite.id !== inviteId));
      } else {
        console.error('Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  // Fetch holographs when component mounts
  useEffect(() => {
    const fetchHolographs = async () => {
      try {
        setIsLoading(true);
    
        // Fetch owned holographs
        const ownedResponse = await fetch(`/api/holograph/principals?userId=${userId}`);
        let ownedData = [];
        if (ownedResponse.ok) {
          try {
            ownedData = await ownedResponse.json();
            console.log("Owned Holographs Response:", ownedData);
          } catch (jsonError) {
            console.error('Error parsing owned holographs:', jsonError);
          }
        } else {
          console.error("Failed to fetch owned holographs:", ownedResponse.status);
        }
    
        // Fetch delegated holographs
        const delegatedResponse = await fetch(`/api/holograph/delegates?userId=${userId}`);
        let delegatedData = [];
        if (delegatedResponse.ok) {
          try {
            delegatedData = await delegatedResponse.json();
            console.log("Delegated Holographs Response:", delegatedData);
          } catch (jsonError) {
            console.error('Error parsing delegated holographs:', jsonError);
          }
        } else {
          console.error("Failed to fetch delegated holographs:", delegatedResponse.status);
        }
        
        console.log("📋 Owned Data Before State Update:", ownedData);
        console.log("📋 Delegated Data Before State Update:", delegatedData);

        setHolographs({
          owned: ownedData.map((holo: Holograph) => ({
            ...holo,
            owner: !holo.owner
              ? { id: "unknown", name: "Unknown User 1" } // ✅ Only fallback if owner is missing
              : typeof holo.owner === "string"
              ? { id: holo.owner, name: "Unknown User 2" }
              : { id: holo.owner.id, name: holo.owner.name !== null ? holo.owner.name : "Unknown User 3" } // ✅ Preserve name if it exists
          })),
          delegated: delegatedData.map((holo: Holograph) => ({
            ...holo,
            owner: !holo.owner
              ? { id: "unknown", name: "Unknown User 4" }
              : typeof holo.owner === "string"
              ? { id: holo.owner, name: "Unknown User 5" }
              : { id: holo.owner.id, name: holo.owner.name !== null ? holo.owner.name : "Unknown User 6" } // ✅ Preserve name if it exists
          }))
        });        
        
        
      } catch (err) {
        setError('Failed to load holographs. Please try again later.');
        console.error('Error fetching holographs:', err);
      } finally {
        setIsLoading(false);
      }
    };        

    const fetchInvitations = async () => {
      console.log("🔍 Fetching invitations for logged-in userId:", userId); // Debugging log
    
      if (!userId) {
        console.error("❌ Error: userId is undefined");
        return;
      }
    
      try {
        const response = await fetch(`/api/invitations/user/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch invitations");
    
        let invitationsData = await response.json();
        console.log("📩 Invitations Data:", invitationsData); // Debugging log
    
        // Fetch Holograph names and inviter names
        const enrichedInvitations = await Promise.all(
          invitationsData.map(async (invite: Invitation) => {
            let holographTitle = "Unknown Holograph";
            let inviterName = "Unknown User";
    
            try {
              // ✅ Fetch Holograph details
              console.log(`🔍 Fetching Holograph Title for ID: ${invite.holographId}`);
              const holographResponse = await fetch(`/api/holograph/${invite.holographId}?userId=${userId}`);
              if (holographResponse.ok) {
                const holographData = await holographResponse.json();
                holographTitle = holographData.title || "Unnamed Holograph";
                console.log(`✅ Holograph Title Fetched: ${holographTitle}`);
              } else {
                console.error(`❌ Failed to fetch Holograph ${invite.holographId}:`, await holographResponse.text());
              }
            } catch (err) {
              console.error(`❌ Error fetching Holograph ${invite.holographId}:`, err);
            }
    
            try {
              // ✅ Fetch Inviter details
              console.log(`🔍 Fetching Inviter Name for ID: ${invite.inviterId}`);
              if (invite.inviterId) {
                const inviterResponse = await fetch(`/api/users/${invite.inviterId}`);
                if (inviterResponse.ok) {
                  const inviterData = await inviterResponse.json();
                  inviterName = inviterData.name || "Unnamed User";
                  console.log(`✅ Inviter Name Fetched: ${inviterName}`);
                } else {
                  console.error(`❌ Failed to fetch Inviter ${invite.inviterId}:`, await inviterResponse.text());
                }
              }
            } catch (err) {
              console.error(`❌ Error fetching inviter ${invite.inviterId}:`, err);
            }
    
            return {
              ...invite,
              holographTitle,
              inviterName,
            };
          })
        );
    
        setInvitations(enrichedInvitations);
      } catch (error) {
        console.error("❌ Error fetching invitations:", error);
      }
    };    

    const handleAcceptInvite = async (inviteId: string, holographId: string) => {
      try {
        const response = await fetch(`/api/invitations/${inviteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Accepted', holographId, userId }),
        });
    
        if (response.ok) {
          setInvitations((prevInvites) => prevInvites.filter(invite => invite.id !== inviteId));
        } else {
          console.error('Failed to accept invitation');
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
      }
    };
    
    const handleDeclineInvite = async (inviteId: string) => {
      try {
        const response = await fetch(`/api/invitations/${inviteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Declined' }),
        });
    
        if (response.ok) {
          setInvitations((prevInvites) => prevInvites.filter(invite => invite.id !== inviteId));
        } else {
          console.error('Failed to decline invitation');
        }
      } catch (error) {
        console.error('Error declining invitation:', error);
      }
    };
    
    fetchHolographs();
    fetchInvitations();

  }, [userId]);

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