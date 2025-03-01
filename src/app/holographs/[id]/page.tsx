// /src/app/holographs/[id]/page.tsx - Holograph Dashboard/Landing Page
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InviteUserModal from '../../_components/holograph/InviteUserModal';
import Link from 'next/link';
import { useHolograph } from '../../../hooks/useHolograph'; // Import the useHolograph hook

interface Holograph {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

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

  // Set the holograph ID in the session when this page loads or when it changes
  useEffect(() => {
    if (params.id && currentHolographId !== params.id) {
      console.log(`🔄 Setting currentHolographId to ${params.id}`);
      setCurrentHolographId(params.id as string);
    }
  }, [params.id, currentHolographId, setCurrentHolographId]);

  // Check authentication
  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isSessionLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchHolograph = async () => {
      try {
        if (!params.id || !userId) return;

        console.log(`🚀 Fetching Holograph Details for ID: ${params.id}`);
        // Now using session-based authentication - no need to pass userId in URL
        const response = await fetch(`/api/holograph/${params.id}`);

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
  }, [params.id, userId, router]);

  if (isSessionLoading || isLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please log in</p>;
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
        onClick={() => router.push('/dashboard')}
        className="bg-gray-500 text-white px-4 py-2 rounded mb-4 hover:bg-gray-600"
      >
        ← Back to Dashboard
      </button>

      {showInviteModal && inviteRole && (
        <InviteUserModal
          holographId={holograph.id}
          role={inviteRole}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Link without URL parameters - using session to pass userId */}
      <div className="mt-6 border-t pt-4">
        <Link href={`/holographs/${holograph.id}/vital-documents`}>
          <h2 className="text-xl font-semibold text-blue-600 hover:underline cursor-pointer">
            Vital Documents
          </h2>
        </Link>
        <p className="text-gray-600">Manage all essential documents like wills, trusts, and health directives.</p>
      </div>
    </div>
  );
};

export default HolographDetailPage;