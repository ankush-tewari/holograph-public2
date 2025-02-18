import React, { useState } from 'react';
import { Plus, Share2, X } from 'lucide-react';
import CreateHolograph from './holograph/CreateHolograph';

// Mock data - in a real app, this would come from your API
const mockHolographs = {
  owned: [
    { id: 1, title: 'Project Roadmap', lastModified: '2025-02-15' },
    { id: 2, title: 'Q1 Results', lastModified: '2025-02-10' }
  ],
  delegated: [
    { id: 3, title: 'Team Guidelines', lastModified: '2025-02-16', owner: 'Sarah Kim' },
    { id: 4, title: 'Marketing Plan', lastModified: '2025-02-12', owner: 'John Doe' }
  ]
};

const HolographDashboard = ({ userId = "mock-user-id" }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('owned');
  
  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // In a real app, you'd refresh the holographs list here
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {showCreateForm ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-2xl bg-white rounded-lg">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
            <CreateHolograph 
              userId={userId}
              onSuccess={handleCreateSuccess}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Holographs</h1>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create New
            </button>
          </div>

          <div className="w-full">
            {/* Tab buttons */}
            <div className="flex gap-4 border-b mb-6">
              <button
                onClick={() => setActiveTab('owned')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'owned'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Holographs
              </button>
              <button
                onClick={() => setActiveTab('delegated')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'delegated'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Shared with Me
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'owned' && (
              <div className="grid gap-4 md:grid-cols-2">
                {mockHolographs.owned.map(holograph => (
                  <div 
                    key={holograph.id} 
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{holograph.title}</h3>
                      <button className="p-2 hover:bg-gray-100 rounded-full">
                        <Share2 size={20} className="text-gray-600" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Last modified: {new Date(holograph.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'delegated' && (
              <div className="grid gap-4 md:grid-cols-2">
                {mockHolographs.delegated.map(holograph => (
                  <div 
                    key={holograph.id} 
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-semibold mb-1">{holograph.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">Shared by {holograph.owner}</p>
                    <p className="text-sm text-gray-600">
                      Last modified: {new Date(holograph.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HolographDashboard;