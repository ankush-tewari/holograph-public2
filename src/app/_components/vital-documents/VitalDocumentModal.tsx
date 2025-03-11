// /src/app/_components/vital-documents/VitalDocumentsModal.tsx

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import React from "react"; // ✅ Ensure React is imported
import { DOCUMENT_TYPES } from "../../../config/documentType";
import { debugLog } from "../../../utils/debug";


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
  onSuccess: () => void;  // adding to make sure page refreshes when changes to vital document are made
}

export default function VitalDocumentModal({ userId, document: docData, holographId, onClose, onSuccess }: 
  VitalDocumentModalProps) { // adding onClose and onSuccess handlers  
  debugLog("🟢 VitalDocumentModal is rendering!"); // ✅ Debug log added

  const [mounted, setMounted] = useState(false); 
  // Only run on client-side after component mounts

  const sectionKey = "vitalDocuments"; //for the contents of the Vital Document Type drop-down list
  
  useEffect(() => {
    debugLog("🔍 Modal component mounted, isModalOpen:", true);
    setMounted(true);
    return () => {
      debugLog("🔍 Modal component unmounting");
      setMounted(false);
    };
  }, []);
  
  const [formData, setFormData] = useState({
    name: docData?.name || "",
    type: docData?.type || DOCUMENT_TYPES.vitalDocuments[0].value, // Set default to first option
    notes: docData?.notes || "",
    file: null as File | null,
    filePath: docData?.filePath || "",  // ✅ Ensure existing file path is included
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
    if (!formData.file && !formData.filePath) { // ✅ Ensure either a new file or existing file is provided
      console.error("❌ No file selected or existing file path missing");
      return;
    }

    // Add validation for all required fields
    if (!formData.name) {
      console.error("❌ Name is required");
      return;
    }

    if (!formData.type) {
      console.error("❌ Document type is required");
      return;
    }

    if (!formData.file && !formData.filePath) {
      console.error("❌ No file selected or existing file path missing");
      return;
    }
  
    const formDataToSend = new FormData();
    formDataToSend.append("holographId", holographId);
    formDataToSend.append("name", formData.name);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("notes", formData.notes || "");
  
    // ✅ IMPORTANT FIX: Always include the existing file path if this is an edit operation
    if (docData && docData.filePath) {
      // Always send the existing file path when editing, regardless of whether a new file is selected
      formDataToSend.append("existingFilePath", docData.filePath);
      debugLog("✅ Including existingFilePath in FormData:", docData.filePath);
    }
  
    // ✅ If a new file is selected, send it
    if (formData.file) {
      // We know formData.file is not null at this point, so it's safe to use
      const fileToUpload: File = formData.file;
      formDataToSend.append("file", fileToUpload);
      debugLog("✅ Including new file in FormData:", fileToUpload.name);
    }
  
    if (userId) {
      formDataToSend.append("uploadedBy", userId);
    } else {
      console.error("❌ No userId found, cannot upload document.");
      return;
    }
  
    debugLog("🟢 Sending FormData:", Object.fromEntries(formDataToSend.entries()));
  
    try {
      await axios.post(`/api/vital-documents`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (onSuccess) {  // Add this check
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("❌ Error uploading document:", error);
    }
  };
  

// Create modal content
// Create modal content with explicit styling
const modalContent = (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {docData ? "Edit Document" : "Add New Document"}
        </h2>
        
        {/* Document Name Input */}
        <label className="block text-gray-700 font-medium">Document Name</label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter document name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {/* Document Type Dropdown */}
        <label className="block text-gray-700 font-medium mt-4">Document Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          {DOCUMENT_TYPES[sectionKey].map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* Notes Input */}
        <label className="block text-gray-700 font-medium mt-4">Notes</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter notes (optional)"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        {/* File Upload */}
        <label className="block text-gray-700 font-medium mt-4">Upload File</label>
        <input
          type="file"
          className="w-full border border-gray-300 rounded-lg p-2"
          onChange={handleFileChange}
        />
        {!formData.file && formData.filePath && (
          <p className="text-gray-600 mt-2">Existing file: {formData.filePath.split('/').pop()}</p>
        )}

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={handleSubmit}
            className="btn-primary"
          >
            {docData ? "Update" : "Upload"}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
);
  
  // Only render on client-side with portal
  if (!mounted) {
    return null;
  }
  
  // Use createPortal to render the modal outside of its parent DOM hierarchy
  debugLog("Creating portal for modal", { mounted, modalContent });
  return createPortal(
    modalContent,
    document.body
  );
}