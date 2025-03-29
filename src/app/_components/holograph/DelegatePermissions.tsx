// /src/app/_components/manage-users/DelegatePermissions.tsx

import { useState, useEffect } from "react";
import { useHolograph } from "@/hooks/useHolograph";
import AccessDeniedModalDashboardRedirect from "@/app/_components/AccessDeniedModalDashboardRedirect";
import { debugLog } from "@/utils/debug";

export default function DelegatePermissions({ holographId }) {
  interface Delegate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [permissions, setPermissions] = useState({});
  const [sections, setSections] = useState<{ id: string; sectionId: string; name: string }[]>([]);
  const [isPrincipal, setIsPrincipal] = useState(false);
  const { isAuthenticated, isLoading: isSessionLoading, userId } = useHolograph();
  const [isCheckingPrincipal, setIsCheckingPrincipal] = useState(true);


  // Principal check
  useEffect(() => {
    if (!holographId || !userId) return;
  
    fetch(`/api/holograph/${holographId}`)
      .then(res => res.json())
      .then(data => {
        const principals = data.principals || [];
        const isCurrentPrincipal = principals.some((p) => p.id === userId);
        setIsPrincipal(isCurrentPrincipal);
      })
      .catch(err => console.error("Failed to verify principal status:", err))
      .finally(() => setIsCheckingPrincipal(false));  // ✅ Done checking
  }, [holographId, userId]);
  
  
  useEffect(() => {
    fetch(`/api/holograph/delegates/list?holographId=${holographId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Delegates loaded:", data); // Debug
        setDelegates(data);
      });
  }, [holographId]);  

  useEffect(() => {
    if (!holographId || !userId) return;
  
    fetch(`/api/holograph/delegate-permissions?holographId=${holographId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("❌ Expected an array but got:", data);
          return;
        }
  
        const permissionsMap = {};
        data.forEach(({ delegateId, sectionId, accessLevel }) => {
          if (!permissionsMap[delegateId]) {
            permissionsMap[delegateId] = {};
          }
          permissionsMap[delegateId][sectionId] = accessLevel;
        });
        setPermissions(permissionsMap);
        debugLog("🗺️ Permissions Map:", permissionsMap); // ✅ Moved here
      })
      .catch((err) => console.error("❌ Error fetching permissions:", err));
  }, [holographId, userId]);


  useEffect(() => {
    fetch(`/api/holograph/${holographId}/sections`) // ✅ New API call to get sections
      .then((res) => res.json())
      .then((data) => {
        setSections(data);
        debugLog("📦 Sections Loaded:", data);  // ✅ Logs correctly
      })      
      .catch((err) => console.error("Error loading sections:", err));
  }, [holographId]);
  

  const handlePermissionChange = (delegateId, sectionId, newLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [delegateId]: { ...prev[delegateId], [sectionId]: newLevel },
    }));

    const payload = {
      holographId,
      delegateId,
      sectionId,
      accessLevel: newLevel,
    };

    debugLog("📤 Sending permission update:", payload); // Add this debug log
   
    fetch("/api/holograph/delegate-permissions", {
      method: "POST",
      body: JSON.stringify({
        holographId,
        delegateId,
        sectionId,
        accessLevel: newLevel,
      }),
      headers: { "Content-Type": "application/json" },
    });
  };

  if (isSessionLoading || isCheckingPrincipal) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  if (!isSessionLoading && !isPrincipal) {
    return (
      <AccessDeniedModalDashboardRedirect message="Only Principals can manage Delegate permissions." />
    );
  }
  

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mt-4">
      <h2 className="text-lg font-semibold">Manage Delegate Permissions</h2>

      {(Array.isArray(delegates) ? delegates.slice().sort((a, b) => a.lastName.localeCompare(b.lastName)) : []).map((delegate) => (
      <div key={delegate.id} className="mt-2">
        <h3 className="font-medium">
          {delegate.firstName} {delegate.lastName} ({delegate.email})
        </h3>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          {sections.map((section) => (
            <div key={section.sectionId} className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <span>{section.name}</span>
              <select
                value={permissions[delegate.id]?.[section.sectionId] || "none"}
                onChange={(e) => handlePermissionChange(delegate.id, section.sectionId, e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="none">None</option>
                <option value="view-only">View-Only</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
  );
}
