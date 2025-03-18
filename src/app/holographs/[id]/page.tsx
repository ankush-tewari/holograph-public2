// /src/app/holographs/[id]/page.tsx - Holograph Dashboard/Landing Page
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InviteUserModal from '../../_components/holograph/InviteUserModal';
import Link from 'next/link';
import { useHolograph } from '../../../hooks/useHolograph'; // Import the useHolograph hook
import { debugLog } from "../../../utils/debug";
import { format } from "date-fns";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { sectionIcons } from "@/config/icons"; // Import the dynamic icons
import AccessDeniedModalDashboardRedirect from "../../_components/AccessDeniedModalDashboardRedirect";



interface HolographUser {
  id: string;
  name: string;
}

interface Holograph {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  principals: HolographUser[];  // ✅ Now includes user.id
  delegates: HolographUser[];  // ✅ Same here
}


interface Section {
  sectionId: string;  // ✅ Add this
  id: string;
  name: string;
  slug: string;
  description: string;
  iconSlug: string;
}

const HolographDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentHolographId, setCurrentHolographId, userId, isAuthenticated, isLoading: isSessionLoading } = useHolograph();
  
  const [holograph, setHolograph] = useState<Holograph | null>(null);
  const [sections, setSections] = useState<Section[]>([]); // Stores dynamic sections
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<'Principal' | 'Delegate' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [delegatePermissions, setDelegatePermissions] = useState<Record<string, string>>({});


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
        setNewTitle(data.title);
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

  // Fetch sections dynamically
  useEffect(() => {
    const fetchSections = async () => {
      try {
        if (!params.id) return;
        debugLog(`🚀 Fetching Sections for Holograph ID: ${params.id}`);
        const response = await fetch(`/api/holograph/${params.id}/sections`);
        if (!response.ok) throw new Error("Failed to fetch sections");
        const data = await response.json();
        setSections(data);
      } catch (err) {
        console.error("❌ Error fetching sections:", err);
      }
    };

    fetchSections();
  }, [params.id]);

  useEffect(() => {
    const fetchDelegatePermissions = async () => {
      if (!params.id || !userId) return;
  
      try {
        const response = await fetch(`/api/holograph/delegate-permissions?userId=${userId}&holographId=${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch delegate permissions");
        const data = await response.json(); // Expected: [{ sectionId, accessLevel }]
        const permissionsMap: Record<string, string> = {};
        data.forEach(({ sectionId, accessLevel }) => {
          permissionsMap[sectionId] = accessLevel;
        });
        setDelegatePermissions(permissionsMap);
        debugLog("✅ Delegate Permissions Fetched:", permissionsMap);
      } catch (err) {
        console.error("❌ Error loading delegate permissions:", err);
      }
    };
  
    // Only fetch permissions if user is not a Principal
    const isPrincipal = holograph?.principals?.some(p => p.id === userId) || false;
    if (!isPrincipal && userId) {
      fetchDelegatePermissions();
    }
  }, [params.id, userId, holograph]);
  

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
  if (!isAuthorized) {
    return (
      <AccessDeniedModalDashboardRedirect message={error || "You are not authorized to view this Holograph."} />
    );
  }
  if (!holograph) return <p className="text-center text-gray-600 text-lg">No Holograph found.</p>;

  const isPrincipal = holograph?.principals?.some(p => p.id === userId) || false;
  debugLog("👑 Holograph Principals:", holograph?.principals);
  debugLog("🧑‍💻 Current User ID:", userId);
  debugLog("🔐 delegatePermissions Map:", delegatePermissions);
  debugLog("🕵️ isPrincipal?", isPrincipal);
  debugLog("📦 Sections Loaded:", sections);



  return (
    <div className="p-8 max-w-full mx-auto bg-stone-50 text-black min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-2">
        {isEditing ? (
          <>
            <input className="border p-2" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
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

          {/* ✅ New "Manage Users" Button */}
          <button 
            onClick={() => router.push(`/holographs/${holograph.id}/manage-users`)} 
            className="btn-primary">
            ⚙️ Manage Users
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
      {sections.map((section) => {
        const IconComponent = sectionIcons[section.iconSlug] || sectionIcons["vital_documents"];
        
        let canAccess = true; // Default for Principals

        if (!isPrincipal) {
          const accessLevel = delegatePermissions[section.sectionId] || "none";
          canAccess = accessLevel === "view-only";
        }

        return (
          <div
            key={section.id}
            className={`block border border-gray-400 shadow-md rounded-lg p-4 
              ${canAccess ? "bg-gray-200 hover:bg-gray-100 cursor-pointer" : "bg-gray-100 cursor-not-allowed opacity-50"}`}
          >
            {canAccess ? (
              <Link href={`/holographs/${holograph.id}/${section.slug}`} className="no-underline">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 no-underline">
                  <IconComponent size={24} /> {section.name}
                </h2>
                <p className="text-gray-700 mt-1 text-sm no-underline">{section.description}</p>
              </Link>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <IconComponent size={24} /> {section.name}
                </h2>
                <p className="text-gray-700 mt-1 text-sm">{section.description}</p>
                <p className="text-red-500 text-xs mt-1 italic">Access Restricted</p>
              </>
            )}
          </div>
        );
      })}

      </div>
    </div>
  );
};

export default HolographDetailPage;
