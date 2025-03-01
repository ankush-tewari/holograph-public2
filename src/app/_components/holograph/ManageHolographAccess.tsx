// src/app/components/holograph/ManageHolographAccess.tsx
'use client';

import React, { useState } from 'react';
import { debugLog } from "../../../utils/debug";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Holograph {
  id: string;
  title: string;
}

interface ManageHolographAccessProps {
  holograph: Holograph;
  currentUser: User;
  principals: User[];
  delegates: User[];
  onAddPrincipal: (user: User) => Promise<void>;
  onRemovePrincipal: (userId: string) => Promise<void>;
  onAddDelegate: (user: User) => Promise<void>;
  onRemoveDelegate: (userId: string) => Promise<void>;
}

const ManageHolographAccess: React.FC<ManageHolographAccessProps> = ({ 
  holograph, 
  currentUser,
  principals = [], 
  delegates = [],
  onAddPrincipal,
  onRemovePrincipal,
  onAddDelegate,
  onRemoveDelegate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'principal' | 'delegate'>('principal');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setError('');
    
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // In a real app, this would be an API call to search users
      // For now, we'll simulate with mock data
      const mockUsers: User[] = [
        { id: 'user4', name: 'Sarah Johnson', email: 'sarah@example.com' },
        { id: 'user5', name: 'Mike Wilson', email: 'mike@example.com' },
      ];

      const filtered = mockUsers.filter(user => 
        (user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase())) &&
        !principals.some(p => p.id === user.id) &&
        !delegates.some(d => d.id === user.id)
      );
      
      setSearchResults(filtered);
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = async (user: User) => {
    try {
      if (searchType === 'principal') {
        await onAddPrincipal(user);
      } else {
        await onAddDelegate(user);
      }
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      setError(`Failed to add ${searchType}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Manage Access - {holograph.title}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSearchType('principal')}
              className={`px-3 py-1 rounded ${
                searchType === 'principal' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
              }`}
            >
              Principals
            </button>
            <button
              onClick={() => setSearchType('delegate')}
              className={`px-3 py-1 rounded ${
                searchType === 'delegate' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
              }`}
            >
              Delegates
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Search Section */}
        <div className="relative mb-6">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <span className="text-gray-400 ml-2">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={`Search users to add as ${searchType}`}
              className="w-full p-2 outline-none"
            />
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div className="absolute w-full mt-1 border rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto z-10">
              {isSearching ? (
                <div className="p-2 text-center text-gray-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <ul>
                  {searchResults.map(user => (
                    <li 
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddUser(user)}
                    >
                      <div>
                        <div>{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <span className="text-blue-500">➕</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-2 text-center text-gray-500">No users found</div>
              )}
            </div>
          )}
        </div>

        {/* Principals List */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Principals:</h4>
          <ul className="space-y-2">
            {principals.map(principal => (
              <li key={principal.id} 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <span className="mr-2">👥</span>
                  <span>{principal.name} ({principal.email})</span>
                </div>
                {principals.length > 1 && principal.id !== currentUser.id && (
                  <button
                    onClick={() => onRemovePrincipal(principal.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded-full"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Delegates List */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Delegates:</h4>
          <ul className="space-y-2">
            {delegates.map(delegate => (
              <li key={delegate.id} 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  <span className="mr-2">👤</span>
                  <span>{delegate.name} ({delegate.email})</span>
                </div>
                <button
                  onClick={() => onRemoveDelegate(delegate.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-full"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManageHolographAccess;