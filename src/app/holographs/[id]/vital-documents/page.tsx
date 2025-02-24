// /src/app/holographs/[id]/vital-documents/page.tsx - Vital Documents Page
"use client";

import { getSession, } from "next-auth/react";
import type { Session } from "next-auth"; // ✅ Correct import
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import VitalDocumentModal from "../../../_components/vital-documents/VitalDocumentModal";


interface Document {
  id: string;
  name: string;
  type: string;
  filePath: string;
  notes: string | null;
  createdAt: string;
}

export default function VitalDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const holographId = params.id as string;
  //console.log("params=" params);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [session, setSession] = useState<Session | null>(null); // ✅ Define state with correct type
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Fetch documents on load
  useEffect(() => {

    async function fetchSession() {
      const userSession = await getSession();
      console.log("🔍 Debug: `getSession()` returned:", userSession); // ✅ Log the session
      setSession(userSession); // ✅ Now `setSession` is properly defined
    } 
    fetchSession();

    async function fetchDocuments() {
      try {
        const response = await axios.get(`/api/vital-documents?holographId=${holographId}`);
        setDocuments(response.data);
      } catch (err) {
        console.error("Failed to load vital documents:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocuments();
  }, [holographId]);

  const openModal = (document: Document | null) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await axios.delete(`/api/vital-documents/${documentId}`);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Vital Documents</h1>
      <p className="text-gray-600">Manage your important documents securely.</p>

      <button onClick={() => setIsModalOpen(true)}>Upload Document</button>
      {isModalOpen && (
        <VitalDocumentModal 
            session={session}  // ✅ Ensure session is passed
            document={selectedDocument} // ✅ Keep document if editing
            holographId={holographId} 
            onClose={closeModal} // ✅ Use closeModal instead of inline function
        />
      )}
      {/* ✅ Debug: Show session details on the page */}
      <pre className="bg-gray-100 p-2">Session [id] VD = {JSON.stringify(session, null, 2)}</pre>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Your Documents</h2>
        {isLoading ? <p>Loading...</p> : (
          documents.length === 0 ? <p>No documents added yet.</p> : (
            <ul>
              {documents.map((doc) => (
                <li key={doc.id} className="p-2 border-b flex justify-between">
                  <div>
                    <a href={doc.filePath} target="_blank" className="text-blue-500 underline">{doc.name}</a> - {doc.type}
                    {doc.notes && <p className="text-gray-600 italic">Notes: {doc.notes}</p>}
                  </div>
                  <div>
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mx-2" onClick={() => openModal(doc)}>
                      Edit
                    </button>
                    <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={() => handleDelete(doc.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
