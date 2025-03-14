// /src/app/_components/holograph/ManageUsers.tsx

"use client";

import { useState, useEffect } from "react";
import { useHolograph } from "@/hooks/useHolograph";
import UserList from "./UserList"; // Will be created inside the same folder
import InviteUserModal from "./InviteUserModal";
import DelegatePermissions from "./DelegatePermissions";
import { useRouter, useParams } from "next/navigation";

// ✅ Define a type for users
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ManageUsers() {
  
  const { currentHolographId: sessionHolographId } = useHolograph(); // ✅ Get Holograph ID from session
  const params = useParams(); // ✅ Get Holograph ID from the URL
  // ✅ Use `params.id` as a fallback if sessionHolographId is missing
  const currentHolographId = sessionHolographId || (params.id as string);
  const [users, setUsers] = useState<User[]>([]); // ✅ Now TypeScript knows it's an array of Users
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  
  useEffect(() => {
    if (!currentHolographId) {
      setError("No Holograph selected.");
      return;
    }

    fetch(`/api/holograph/users?holographId=${currentHolographId}`)
      .then((res) => res.json())
      .then((data: User[]) => { // ✅ Explicitly tell TypeScript this API returns an array of User
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error("Unexpected API response:", data);
          setUsers([]);
        }
      })
      .catch(() => setError("Failed to load users."));
  }, [currentHolographId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      {error && <p className="text-red-500">{error}</p>}

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => setIsModalOpen(true)}
      >
        Invite User
      </button>

      {isModalOpen && (
        <InviteUserModal
          holographId={currentHolographId}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <UserList users={users} />

      <h2 className="text-xl font-semibold mt-6">Delegate Permissions</h2>
      <DelegatePermissions holographId={currentHolographId} />

      <button
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        onClick={() => router.push(`/holographs/${currentHolographId}`)}
      >
        ← Back to Holograph
      </button>
    </div>
  );
}