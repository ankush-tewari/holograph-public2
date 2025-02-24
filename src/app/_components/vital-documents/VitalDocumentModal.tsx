// /src/app/_components/vital-documents/VitalDocumentsModal.tsx

"use client";

import { useState } from "react";
import axios from "axios";
import { Session } from "next-auth"; // ✅ Import Session type

interface VitalDocument {
    id: string;
    name: string;
    type: string;
    filePath?: string;
    notes?: string | null;
}

interface VitalDocumentModalProps {
    session: Session | null; // ✅ Add session as a prop
    document?: {
      id: string;
      name: string;
      type: string;
      filePath?: string;
      notes?: string | null;
  } | null;
  holographId: string;
  onClose: () => void;
}

export default function VitalDocumentModal({ session, document, holographId, onClose }: VitalDocumentModalProps) {
    const [formData, setFormData] = useState({
        name: document?.name || "",
        type: document?.type || "",
        notes: document?.notes || "",
        file: null as File | null,
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files; // Extract files to a variable

      if (!files || files.length === 0) {
          console.warn("❌ No file selected or input was cleared.");
          return;
      }
  
      setFormData((prev) => ({ ...prev, file: files[0] }));
    };

    const handleSubmit = async () => {
      if (!formData.file) {
          console.error("❌ No file selected");
          return;
      }
  
      const formDataToSend = new FormData();
      formDataToSend.append("holographId", holographId);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("notes", formData.notes || "");
      formDataToSend.append("file", formData.file);
      if (session?.user?.id) { // ✅ Ensure session.user?.id exists before appending
        formDataToSend.append("uploadedBy", session.user.id);
      } else {
          console.error("❌ No user session found, cannot upload document.");
          return;
      }
  
      // 🔍 Debug: Log form data before sending
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
                <h2 className="text-xl font-semibold">{document ? "Edit Document" : "Upload New Document"}</h2>
                <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input type="text" placeholder="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
                <textarea placeholder="Notes" value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                    {document ? "Update" : "Upload"}
                </button>
                <button onClick={onClose} className="ml-2 px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
            </div>
        </div>
    );
}
