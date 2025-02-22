// CreateHolograph.tsx
import React, { useState } from 'react';

interface Holograph {
  id: string;
  title: string;
  lastModified: string;
  owner?: string;
}

interface CreateHolographProps {
  userId: string;
  onSuccess?: (newHolograph: Holograph) => void | Promise<void>; // ✅ Matches the function type
  onCancel?: () => void;
}



const CreateHolograph: React.FC<CreateHolographProps> = ({ 
  userId, 
  onSuccess,
  onCancel 
}) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    try {
      const response = await fetch('/api/holograph/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, userId }),
      });
  
      if (!response.ok) {
        console.error("❌ API error:", response.statusText);
        return;
      }
  
      const newHolograph = await response.json(); // ✅ Read response JSON only once
      console.log("✅ Holograph created:", newHolograph);
  
      if (onSuccess) {
        console.log("✅ Calling onSuccess function...");
        onSuccess(newHolograph);
      }
    } catch (error) {
      console.error("❌ Error creating holograph:", error);
    }
  };
    

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Holograph</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="title" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Holograph'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHolograph;