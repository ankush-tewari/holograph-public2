// /src/app/holographs/[id]/page.tsx - Holograph Dashboard/Landing Page
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InviteUserModal from '../../_components/holograph/InviteUserModal';
import Link from 'next/link';
import { useHolograph } from '../../../hooks/useHolograph'; // Import the useHolograph hook
import { debugLog } from "../../../utils/debug";
import { format } from "date-fns";
import { FiLink, FiEdit, FiTrash2, FiDelete } from "react-icons/fi";

interface Holograph {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  principals: { name: string }[];
  delegates: { name: string }[];
}

const SECTIONS = [
  { id: 'vital-documents', name: 'Vital Documents', icon: '📂', description: 'Manage all essential documents like wills, trusts, and health directives.' },
  { id: 'financial-accounts', name: 'Financial Accounts', icon: '💰', description: 'Manage bank accounts, investments, and financial assets.' },
  { id: 'insurance-accounts', name: 'Insurance Accounts', icon: '🛡️', description: 'Organize life, health, and property insurance policies.' },
  { id: 'properties', name: 'Properties', icon: '🏡', description: 'Keep track of owned real estate and property-related documents.' },
  { id: 'personal-properties', name: 'Personal Properties', icon: '📦', description: 'Document valuable personal belongings and heirlooms.' },
  { id: 'social-media', name: 'Social Media', icon: '📱', description: 'Manage digital legacy and social media accounts.' },
  { id: 'utilities', name: 'Utilities', icon: '⚡', description: 'Track and manage home utility services.' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📜', description: 'List and manage ongoing subscriptions.' },
  { id: 'reward-programs', name: 'Reward Programs', icon: '🎁', description: 'Organize frequent flyer miles, store rewards, and more.' },
  { id: 'home-services', name: 'Home Services', icon: '🛠️', description: 'Track household maintenance services and providers.' }
];

const HolographDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentHolographId, setCurrentHolographId, userId, isAuthenticated, isLoading: isSessionLoading } = useHolograph();
  
  const [holograph, setHolograph] = useState<Holograph | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<'Principal' | 'Delegate' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (params.id && currentHolographId !== params.id) {
      debugLog(`🔄 Setting currentHolographId to ${params.id}`);
      setCurrentHolographId(params.id as string);
    }
  }, [params.id, currentHolographId, setCurrentHolographId]);

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isSessionLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchHolograph = async () => {
      try {
        if (!params.id || !userId) return;
        debugLog(`🚀 Fetching Holograph Details for ID: ${params.id}`);
        const response = await fetch(`/api/holograph/${params.id}`);
        if (!response.ok) throw new Error("Unauthorized or Holograph not found");
        const data = await response.json();
        
        debugLog(`🔍 Checking authorization for user ${userId}`);
        debugLog("✅ Full API Response:", data);  // 🔍 Log the entire response
        debugLog("✅ Holograph Data:", data);
        debugLog("✅ Holograph Principals:", data.principals);
        debugLog("✅ Holograph Delegates:", data.delegates);

        setHolograph(data);
        setNewTitle(data.title); // Ensure the input field has the current title value
        setIsAuthorized(true);
      } catch (err) {
        console.error("❌ Error fetching Holograph:", err);
        setError("You are not authorized to view this Holograph");
        setTimeout(() => router.push("/holographs"), 3000);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetchHolograph();
  }, [params.id, userId, router]);

  const handleEdit = async () => {
    if (!holograph) return;
    await fetch(`/api/holograph/${holograph.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setHolograph((prev) => prev ? { ...prev, title: newTitle } : prev);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!holograph) return;
    if (
      !confirm("Are you sure you want to delete this Holograph? Deleting this Holograph will also delete all sections, and this action cannot be undone.")
    ) return;
  
    try {
      const response = await fetch(`/api/holograph/${holograph.id}`, { method: "DELETE" });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Failed to delete Holograph:", errorData);
        alert("Failed to delete Holograph: " + errorData.error);
        return;
      }
  
      console.log("✅ Holograph deleted successfully.");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("Unexpected error occurred while deleting the Holograph.");
    }
  };

  if (isSessionLoading || isLoading) return <p className="text-center text-gray-500 text-lg">Loading...</p>;
  if (!isAuthenticated) return <p className="text-center text-red-500 text-lg">Please log in</p>;
  if (!isAuthorized) return <p className="text-center text-red-600 text-lg">{error}</p>;
  if (!holograph) return <p className="text-center text-gray-600 text-lg">No Holograph found.</p>;

  return (
    <div className="p-8 max-w-full mx-auto bg-stone-50 text-black min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              className="border p-2"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <button className="ml-2 btn-primary" onClick={handleEdit}>Submit</button>
            <button className="ml-2 btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        ) : (
          <>
            {holograph.title}     

            {/* Info Icon with smaller size */}
            <span className="ml-2 text-sm relative group cursor-pointer">
              <span className="text-lg">ℹ️</span>
              <div className="absolute left-0 mt-2 w-64 bg-white text-sm text-gray-700 p-3 border border-gray-300 shadow-lg rounded hidden group-hover:block">
                <p><span className="font-semibold">Principals:</span> 
                  {holograph.principals && holograph.principals.length > 0 ? 
                    holograph.principals.map(p => p.name).join(", ") : 'None'}
                </p>
                <p><span className="font-semibold">Delegates:</span> 
                  {holograph.delegates && holograph.delegates.length > 0 ? 
                    holograph.delegates.map(d => d.name).join(", ") : 'None'}
                </p>
                <p className="mt-2 text-xs text-gray-500">Created: {format(new Date(holograph.createdAt), "MMM d, yyyy")}</p>
                <p className="text-xs text-gray-500">Last Updated: {format(new Date(holograph.updatedAt), "MMM d, yyyy")}</p>
              </div>
            </span>

            {/* Edit Icon with Tooltip */}
            <button className="ml-2 text-yellow-600 text-sm relative group" onClick={() => setIsEditing(true)}>
              <span><FiEdit size={18} /></span>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition">
                Edit Holograph Name
              </span>
            </button>

            {/* Delete Icon with Tooltip */}
            <button className="ml-2 text-red-600 text-sm relative group" onClick={handleDelete}>
              <span><FiTrash2 size={18} /></span>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition">
                Delete Holograph (Caution!)
              </span>
            </button>
          </>
        )}
      </h1>
        <div className="flex gap-4">
          <button 
            className="btn-primary" 
            onClick={() => { setInviteRole('Principal'); setShowInviteModal(true); }}>➕   Add Principal
          </button>
          <button 
            className="btn-primary" 
            onClick={() => { setInviteRole('Delegate'); setShowInviteModal(true); }}>👥    Add Delegate
          </button>
          <button
            onClick={() => router.push(`/dashboard`)}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
          <div className="mt-6 flex gap-4">
       </div>
      </div>

        {showInviteModal && inviteRole && (
          <InviteUserModal holographId={holograph.id} role={inviteRole} onClose={() => setShowInviteModal(false)} />
        )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        {SECTIONS.map(section => (
          <Link key={section.id} href={`/holographs/${holograph.id}/${section.id}`} className="block border border-gray-400 shadow-md rounded-lg p-4 bg-gray-200 hover:bg-gray-100 transition cursor-pointer no-underline">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 no-underline">
              {section.icon} {section.name}
            </h2>
            <p className="text-gray-700 mt-1 text-sm no-underline">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HolographDetailPage;
