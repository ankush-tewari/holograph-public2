// /src/app/_components/holograph/CreateHolograph.tsx

"use client";

import React, { useState } from 'react';
import { debugLog } from "../../../utils/debug";

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
    setIsSubmitting(true);
    setError(""); // ✅ Clear old errors
  
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/holograph/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
  
      if (!response.ok) {
        console.error("❌ API error:", response.statusText);
        return;
      }
  
      const newHolograph = await response.json(); // ✅ Read response JSON only once
      debugLog("✅ Holograph created:", newHolograph);
  
      if (onSuccess) {
        debugLog("✅ Calling onSuccess function...");
        onSuccess(newHolograph);
      }

      setIsSubmitting(false);
    } catch (error) {
      console.error("❌ Error creating holograph:", error);
      setIsSubmitting(false);
    }
  };
    

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create a new Holograph</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="title" 
            className="block text-lg font-semibold text-gray-700 mb-2"
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

        <div className="flex justify-end gap-4 mt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
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