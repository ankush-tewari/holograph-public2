// /src/app/_components/vital-documents/VitalDocumentsModal.tsx

"use client";

import { useState } from "react";
import axios from "axios";

interface VitalDocument {
  id: string;
  name: string;
  type: string;
  filePath?: string;
  notes?: string | null;
}

interface VitalDocumentModalProps {
  userId: string; // ✅ Changed from session to userId
  document?: VitalDocument | null;
  holographId: string;
  onClose: () => void;
}

export default function VitalDocumentModal({ userId, document, holographId, onClose }: VitalDocumentModalProps) {
  const [formData, setFormData] = useState({
    name: document?.name || "",
    type: document?.type || "",
    notes: document?.notes || "",
    file: null as File | null,
    filePath: document?.filePath || "",  // ✅ Ensure existing file path is included
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.warn("❌ No file selected or input was cleared.");
      return;
    }
    setFormData((prev) => ({ ...prev, file: files[0] }));
  };

  const handleSubmit = async () => {
    if (!formData.file && !formData.existingFilePath) { // ✅ Ensure either a new file or existing file is provided
      console.error("❌ No file selected or existing file path missing");
      return;
    }
  
    const formDataToSend = new FormData();
    formDataToSend.append("holographId", holographId);
    formDataToSend.append("name", formData.name);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("notes", formData.notes || "");
  
    // ✅ If a new file is selected, send it
    if (formData.file) {
      formDataToSend.append("file", formData.file);
    } else {
      // ✅ Otherwise, send the existing file path
      formDataToSend.append("existingFilePath", formData.existingFilePath);
    }
  
    if (userId) {
      formDataToSend.append("uploadedBy", userId);
    } else {
      console.error("❌ No userId found, cannot upload document.");
      return;
    }
  
    console.log("🟢 Sending FormData:", Object.fromEntries(formDataToSend.entries()));
  
    try {
      await axios.post(`/api/vital-documents`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onClose();
    } catch (error) {
      console.error("❌ Error uploading document:", error);
    }
  };
  
  
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl font-semibold">
          {document ? "Edit Document" : "Upload New Document"}
        </h2>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        />
        <textarea
          placeholder="Notes"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
        <input 
          type="file" 
          onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
        />
        {!formData.file && formData.filePath && (
          <p className="text-gray-600">Existing file: {formData.filePath.split('/').pop()}</p>
        )}
        <button
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {document ? "Update" : "Upload"}
        </button>
        <button onClick={onClose} className="ml-2 px-4 py-2 bg-gray-500 text-white rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}
