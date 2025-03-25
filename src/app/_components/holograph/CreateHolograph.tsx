// /src/app/_components/holograph/CreateHolograph.tsx

"use client";

import React, { useState } from 'react';
import { debugLog } from "../../../utils/debug";
import { buttonIcons } from '@/config/icons';

interface Holograph {
  id: string;
  title: string;
  lastModified: string;
  owner?: string;
}

interface CreateHolographProps {
  userId: string;
  onSuccess?: (newHolograph: Holograph) => void | Promise<void>;
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

  const SaveIcon = buttonIcons.save;
  const CloseIcon = buttonIcons.close;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/holograph/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        setError("Something went wrong. Please try again.");
        console.error("❌ API error:", response.statusText);
        setIsSubmitting(false);
        return;
      }

      const newHolograph = await response.json();
      debugLog("✅ Holograph created:", newHolograph);

      if (onSuccess) {
        onSuccess(newHolograph);
      }

    } catch (err) {
      console.error("❌ Error creating holograph:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create a new Holograph</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-xl bold font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Holograph title"
            required
          />
        </div>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              <CloseIcon className="w-4 h-4" />
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-save-conditional"
            disabled={isSubmitting}
          >
            <SaveIcon className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHolograph;
