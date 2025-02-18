import React, { useState, useEffect } from 'react';
import { Plus, Share2, X } from 'lucide-react';
import CreateHolograph from './holograph/CreateHolograph';

// Define types for our data
interface Holograph {
  id: string;
  title: string;
  lastModified: string;
  owner?: string;
}

interface DashboardProps {
  userId: string;
}

const HolographDashboard = ({ userId }: DashboardProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('owned');
  const [holographs, setHolographs] = useState<{
    owned: Holograph[];
    delegated: Holograph[];
  }>({
    owned: [],
    delegated: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch holographs when component mounts
  useEffect(() => {
    const fetchHolographs = async () => {
      try {
        setIsLoading(true);
        
        // Fetch owned holographs
        const ownedResponse = await fetch('/api/holograph/principals');
        const ownedData = await ownedResponse.json();
        
        // Fetch delegated holographs
        const delegatedResponse = await fetch('/api/holograph/delegates');
        const delegatedData = await delegatedResponse.json();

        if (!ownedResponse.ok || !delegatedResponse.ok) {
          throw new Error('Failed to fetch holographs');
        }

        setHolographs({
          owned: ownedData,
          delegated: delegatedData
        });
      } catch (err) {
        setError('Failed to load holographs. Please try again later.');
        console.error('Error fetching holographs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolographs();
  }, [userId]);

  const handleCreateSuccess = async (newHolograph: Holograph) => {
    setHolographs(prev => ({
      ...prev,
      owned: [...prev.owned, newHolograph]
    }));
    setShowCreateForm(false);
  };

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

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

            {/* Loading state */}
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Tab content */}
                {activeTab === 'owned' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {holographs.owned.map(holograph => (
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
                    {holographs.delegated.map(holograph => (
                      <div 
                        key={holograph.id} 
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                      >
                        <h3 className="text-lg font-semibold mb-1">{holograph.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Shared by {holograph.owner}
                        </p>
                        <p className="text-sm text-gray-600">
                          Last modified: {new Date(holograph.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HolographDashboard;