// /src/app/_components/holograph/ManageUsers.tsx

"use client";

import { useState, useEffect } from "react";
import { useHolograph } from "@/hooks/useHolograph";
import InviteUserModal from "./InviteUserModal";
import DelegatePermissions from "./DelegatePermissions";
import { useRouter, useParams } from "next/navigation";
import AccessDeniedModalDashboardRedirect from "@/app/_components/AccessDeniedModalDashboardRedirect";
import { userIcons, buttonIcons } from "@/config/icons";
import { debugLog } from "@/utils/debug";

// ✅ Define a type for users
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function ManageUsers() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isSessionLoading } = useHolograph();

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isSessionLoading, isAuthenticated, router]);

  const { currentHolographId: sessionHolographId } = useHolograph(); // ✅ Get Holograph ID from session
  const params = useParams(); // ✅ Get Holograph ID from the URL
  // ✅ Use `params.id` as a fallback if sessionHolographId is missing
  const currentHolographId = sessionHolographId || (params.id as string);
  const [users, setUsers] = useState<User[]>([]); // ✅ Now TypeScript knows it's an array of Users
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteRole, setInviteRole] = useState<'Principal' | 'Delegate' | null>(null);

  const { userId } = useHolograph(); // Get current userId
  const [isPrincipal, setIsPrincipal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  


  
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

  // checks whether or not the user has access to this page
  useEffect(() => {
    if (!currentHolographId || !userId) return;
  
    fetch(`/api/holograph/${currentHolographId}`)
      .then((res) => res.json())
      .then((data) => {
        const principals = data.principals || [];
        const isCurrentPrincipal = principals.some((p: any) => p.id === userId);
        setIsPrincipal(isCurrentPrincipal);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to verify user role.");
        setIsLoading(false);
      });
  }, [currentHolographId, userId]);
  
  if (isLoading) return <p className="text-center text-gray-500">Loading...</p>;

  if (!isPrincipal) {
    return (
      <AccessDeniedModalDashboardRedirect
        message="You do not have permission to manage users for this Holograph."
      />
    );
  }

  if (isSessionLoading || isLoading) return <p className="text-center text-gray-500">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      {error && <p className="text-red-500">{error}</p>}

      <button
        className="btn-secondary"
        onClick={() => router.push(`/holographs/${currentHolographId}`)}
      >
        ← Back to Holograph
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Principals Section */}
        <div className="bg-white shadow-md rounded-lg p-4 mt-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>Principals</span>
          <button
            className="text-green-600 hover:text-green-800 relative group"
            onClick={() => {
              setInviteRole("Principal");
              setIsModalOpen(true);
            }}
          >
            <userIcons.addPrincipal size={18} />
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition">
              Add Principal
            </span>
          </button>
        </h2>

        <ul className="space-y-2">
          {users.filter(user => user.role === "Principal").map(user => (
            <li key={user.id} className="border-b pb-2">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Delegates Section */}
      <div className="bg-white shadow-md rounded-lg p-4 mt-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>Delegates</span>
        <button
          className="text-blue-600 hover:text-blue-800 relative group"
          onClick={() => {
            setInviteRole("Delegate");
            setIsModalOpen(true);
          }}
        >
          <userIcons.addDelegate size={18} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition">
            Add Delegate
          </span>
        </button>
      </h2>
      <div className="space-y-4">
        {users.filter(user => user.role === "Delegate").map(user => (
          <div key={user.id} className="bg-white border border-gray-300 shadow-md rounded-lg p-4 flex justify-between items-center">
              <p className="font-medium text-gray-800">
                {user.firstName} {user.lastName} <span className="text-gray-500">({user.email})</span>
              </p>
            <button
              className="text-red-600 hover:text-red-800 relative group"
              onClick={() => handleRemoveDelegate(user.id)} // You'll define this
            >
              <buttonIcons.delete size={18} />
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition">
                Remove this Delegate
              </span>
            </button>
          </div>
        ))}
      </div>

      </div>
    </div>


      {/* ✅ InviteUserModal appears based on selected role */}
      {isModalOpen && inviteRole && (
        <InviteUserModal
          holographId={currentHolographId}
          role={inviteRole}
          onClose={() => {
            setIsModalOpen(false);
            setInviteRole(null); // Reset role after closing
          }}
        />
      )}

      <hr className="my-6 border-t border-gray-300" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Delegate Permissions</h2>

      <DelegatePermissions holographId={currentHolographId} useSectionIds={true} />
    </div>
  );
}