// /src/app/holographs/[id]/page.tsx - Holograph Dashboard/Landing Page.  this shows all the components of the dashboard.
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InviteUserModal from '../../_components/holograph/InviteUserModal';
import Link from 'next/link';

interface Holograph {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const HolographDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [holograph, setHolograph] = useState<Holograph | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<'Principal' | 'Delegate' | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // ✅ Store userId

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        console.log("🚀 Fetching user session in Holograph Landing Page...");
        const authResponse = await fetch(`/api/auth/user`);
        if (!authResponse.ok) throw new Error("Not authenticated");

        const authData = await authResponse.json();
        console.log("🔍 Auth Data:", authData);

        if (!authData.user || !authData.user.id) {
          throw new Error("User ID missing");
        }

        setUserId(authData.user.id);
        console.log("✅ Retrieved User ID:", authData.user.id);
      } catch (error) {
        console.error("❌ Error fetching user session:", error);
        setError("Authentication error. Please log in again.");
        router.push("/login");
      }
    };

    fetchUserSession();
  }, [router]);

  useEffect(() => {
    const fetchHolograph = async () => {
      try {
        if (!params.id || !userId) return;

        console.log(`🚀 Fetching Holograph Details for ID: ${params.id} and User ID: ${userId}`);
        const response = await fetch(`/api/holograph/${params.id}?userId=${userId}`);

        if (!response.ok) throw new Error("Unauthorized or Holograph not found");

        const data = await response.json();
        console.log("✅ Holograph Data:", data);

        setHolograph(data);
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
  }, [params.id, userId]);

  if (isLoading) return <p>Loading...</p>;
  if (!isAuthorized) return <p className="text-red-500">{error}</p>;
  if (!holograph) return <p>No Holograph found.</p>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">{holograph.title}</h1>
      <p className="text-gray-600">Created: {new Date(holograph.createdAt).toLocaleDateString()}</p>
      <p className="text-gray-600">Last Updated: {new Date(holograph.updatedAt).toLocaleDateString()}</p>
      
      <div className="mt-6 flex gap-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => { setInviteRole('Principal'); setShowInviteModal(true); }}
        >
          Add Principal
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          onClick={() => { setInviteRole('Delegate'); setShowInviteModal(true); }}
        >
          Add Delegate
        </button>
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => router.push('/dashboard')}
      >
        Back to Dashboard
      </button>

      {showInviteModal && inviteRole && (
        <InviteUserModal
          holographId={holograph.id}
          role={inviteRole}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* ✅ Pass userId in the URL only if it's available */}
      <div className="mt-6 border-t pt-4">
        {userId ? (
          <Link href={`/holographs/${holograph.id}/vital-documents?userId=${encodeURIComponent(userId)}`}>
            <h2 className="text-xl font-semibold text-blue-600 hover:underline cursor-pointer">
              Vital Documents
            </h2>
          </Link>
        ) : (
          <p className="text-red-500">Loading user info...</p>
        )}
        <p className="text-gray-600">Manage all essential documents like wills, trusts, and health directives.</p>
      </div>
    </div>
  );
};

export default HolographDetailPage;
