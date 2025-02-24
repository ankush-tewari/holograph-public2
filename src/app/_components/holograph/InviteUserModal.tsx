// /src/app/components/holograph/InviteUserModal.tsx
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
      // ✅ Fetch the logged-in user to get inviterId
      const authResponse = await fetch('/api/auth/user');
      const authData = await authResponse.json();
  
      console.log("🔍 Auth Data:", authData); // ✅ Log the auth data
  
      if (!authResponse.ok || !authData.user || !authData.user.id) {
        throw new Error('Failed to retrieve the inviter ID');
      }
  
      const inviterId = authData.user.id;
  
      const requestBody = {
        holographId,
        inviteeEmail: email,
        role,
        inviterId, // ✅ Ensure inviterId is included
      };  
  
      console.log("📤 Sending Invitation API Request:", requestBody); // ✅ Debug log before sending
  
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
  
      console.log("📩 Raw Response:", response); // ✅ Log response
  
      if (!response.ok) {
        const errorData = await response.json(); // Parse error response
      
        if (response.status === 400) {
          if (errorData.error.includes("already a Delegate") && role === "Delegate") {
            setError("This user is already a Delegate for this Holograph.");
          } else if (errorData.error.includes("already a Principal") && role === "Principal") {
            setError("This user is already a Principal for this Holograph.");
          } else if (errorData.error.includes("already a Delegate") && role === "Principal") {
            setError("This user is already a Delegate and cannot be assigned as a Principal.");
          } else if (errorData.error.includes("already a Principal") && role === "Delegate") {
            setError("This user is already a Principal and cannot be assigned as a Delegate.");
          } else {
            setError(errorData.error);
          }
        } else if (response.status === 404) {
          setError("Email does not belong to a registered user, please try again.");
          setEmail(""); // Clear the input field
        } else {
          setError(`Error: ${response.statusText}`);
        }
      
        setIsLoading(false);
        return;
      }
  
      const data = await response.json();
      console.log("✅ API Response Data:", data);
  
      setSuccess(`Invitation sent successfully to ${email}`);
      setEmail('');
    } catch (err: any) {
      console.error("❌ Error inviting user:", err);
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
