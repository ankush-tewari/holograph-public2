// /src/app/holographs/[id]/page.tsx - Holograph Detail Page
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InviteUserModal from '../../components/holograph/InviteUserModal';
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

  useEffect(() => {
    const fetchHolograph = async () => {
      try {
        // Fetch the logged-in user
        const authResponse = await fetch(`/api/auth/user`);
        const authData = await authResponse.json();
  
        if (!authResponse.ok || !authData.user || !authData.user.id) {
          console.error('Error: Failed to retrieve user ID', authData);
          setError('Authentication error. Please log in again.');
          return;
        }
  
        const userId = authData.user.id; // ✅ Correctly extract user ID
  
        // Fetch the Holograph details
        const response = await fetch(`/api/holograph/${params.id}?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Unauthorized or Holograph not found');
        }
  
        const data = await response.json();
        setHolograph(data);
        setIsAuthorized(true);
      } catch (err) {
        console.error('Error fetching Holograph:', err);
        setError('You are not authorized to view this Holograph');
        setTimeout(() => router.push('/holographs'), 3000);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (params.id) {
      fetchHolograph();
    }
  }, [params, router]);
  

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
      {/* ✅ New "Vital Documents" Section */}
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
