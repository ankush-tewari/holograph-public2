// /src/app/_components/manage-users/DelegatePermissions.tsx

import { useState, useEffect } from "react";
import { debugLog } from "../../../utils/debug";

export default function DelegatePermissions({ holographId }) {
  const [delegates, setDelegates] = useState([]);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    fetch(`/api/holograph/delegates?holographId=${holographId}`)
      .then((res) => res.json())
      .then((data) => setDelegates(data));
  }, [holographId]);

  useEffect(() => {
    fetch(`/api/holograph/delegate-permissions?holographId=${holographId}`)
      .then((res) => res.json())
      .then((data) => {
        const permissionsMap = {};
        data.forEach(({ delegateId, section, accessLevel }) => {
          if (!permissionsMap[delegateId]) {
            permissionsMap[delegateId] = {};
          }
          permissionsMap[delegateId][section] = accessLevel;
        });
        setPermissions(permissionsMap);
      });
  }, [holographId]);

  const handlePermissionChange = (delegateId, section, newLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [delegateId]: { ...prev[delegateId], [section]: newLevel },
    }));

    fetch("/api/holograph/delegate-permissions", {
      method: "POST",
      body: JSON.stringify({
        holographId,
        delegateId,
        section,
        accessLevel: newLevel,
      }),
      headers: { "Content-Type": "application/json" },
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mt-4">
      <h2 className="text-lg font-semibold">Manage Delegate Permissions</h2>
      {delegates.map((delegate) => (
        <div key={delegate.id} className="mt-2">
          <h3 className="font-medium">{delegate.name} ({delegate.email})</h3>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {["Vital Documents", "Financial Accounts", "Digital Assets"].map((section) => (
              <div key={section} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span>{section}</span>
                <select
                  value={permissions[delegate.id]?.[section] || "view-only"}
                  onChange={(e) => handlePermissionChange(delegate.id, section, e.target.value)}
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
