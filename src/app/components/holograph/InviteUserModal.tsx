// /src/components/holograph/InviteUserModal.tsx
'use client';

import { useState } from 'react';

interface InviteUserModalProps {
  holographId: string;
  role: 'Principal' | 'Delegate';
  onClose: () => void;
}

const InviteUserModal = ({ holographId, role, onClose }: InviteUserModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
  
    try {
      // Fetch the logged-in user to get inviterId
      const authResponse = await fetch('/api/auth/user');
      const authData = await authResponse.json();
  
      if (!authResponse.ok || !authData.user || !authData.user.id) {
        throw new Error('Failed to retrieve the inviter ID');
      }
  
      const inviterId = authData.user.id; // ✅ Ensure inviterId is included
  
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holographId,
          inviteeEmail: email,
          role,
          inviterId, // ✅ Ensure inviterId is in the request
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
  
      setSuccess(`Invitation sent successfully to ${email}`);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Invite a {role}</h2>
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-500 mb-2">{success}</p>}
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-500 text-white rounded" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleInvite}
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;
