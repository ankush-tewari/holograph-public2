// src/app/holographs/page.tsx NOT SURE IF THIS PAGE IS USED AT ALL
'use client';

import React, { useState, useEffect } from 'react';
import CreateHolograph from '../_components/holograph/CreateHolograph';
import ManageHolographAccess from '../_components/holograph/ManageHolographAccess';
import { debugLog } from "../../utils/debug";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Holograph {
  id: string;
  title: string;
  content: string;
  principals: User[];
  delegates: User[];
}

const HolographsPage = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedHolograph, setSelectedHolograph] = useState<Holograph | null>(null);
  const [holographs, setHolographs] = useState<Holograph[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Handle create holograph success
  const handleCreateSuccess = () => {
    setIsCreating(false);
    // Refresh holographs list
    // This would need a GET endpoint to fetch holographs
  };

  // Handlers for managing principals and delegates
  const handleAddPrincipal = async (user: User) => {
    try {
      const response = await fetch('/api/holograph/principals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holographId: selectedHolograph?.id,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add principal');
      }

      // Refresh holograph data
      // This would need an endpoint to fetch updated holograph data
    } catch (error) {
      console.error('Error adding principal:', error);
    }
  };

  const handleRemovePrincipal = async (userId: string) => {
    try {
      const response = await fetch(`/api/holograph/principals?holographId=${selectedHolograph?.id}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove principal');
      }

      // Refresh holograph data
    } catch (error) {
      console.error('Error removing principal:', error);
    }
  };

  const handleAddDelegate = async (user: User) => {
    try {
      const response = await fetch('/api/holograph/delegates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holographId: selectedHolograph?.id,
          delegateId: user.id,
          principalId: currentUser?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add delegate');
      }

      // Refresh holograph data
    } catch (error) {
      console.error('Error adding delegate:', error);
    }
  };

  const handleRemoveDelegate = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/holograph/delegates?holographId=${selectedHolograph?.id}&delegateId=${userId}&principalId=${currentUser?.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove delegate');
      }

      // Refresh holograph data
    } catch (error) {
      console.error('Error removing delegate:', error);
    }
  };

  if (!currentUser) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Holographs</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Holograph
        </button>
      </div>

      {isCreating && (
        <div className="mb-8">
          <CreateHolograph
            userId={currentUser.id}
            onSuccess={handleCreateSuccess}
          />
        </div>
      )}

      {selectedHolograph && currentUser && (
        <ManageHolographAccess
          holograph={selectedHolograph}
          currentUser={currentUser}
          principals={selectedHolograph.principals}
          delegates={selectedHolograph.delegates}
          onAddPrincipal={handleAddPrincipal}
          onRemovePrincipal={handleRemovePrincipal}
          onAddDelegate={handleAddDelegate}
          onRemoveDelegate={handleRemoveDelegate}
        />
      )}

      {/* List of holographs */}
      <div className="grid gap-4">
        {holographs.map((holograph) => (
          <div
            key={holograph.id}
            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedHolograph(holograph)}
          >
            <h3 className="text-lg font-medium">{holograph.title}</h3>
            <p className="text-gray-600 text-sm mt-1">
              {holograph.principals.length} Principals · {holograph.delegates.length} Delegates
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolographsPage;