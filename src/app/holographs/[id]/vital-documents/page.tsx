// /src/app/holographs/[id]/vital-documents/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import VitalDocumentModal from "../../../_components/vital-documents/VitalDocumentModal";
import { DOCUMENT_TYPES } from "../../../../config/documentType";
import { useSession } from "next-auth/react";
import { useHolograph } from "../../../../hooks/useHolograph"; // Import useHolograph hook
import SessionDebug from "../../../_components/SessionDebug"; // Optional, for debugging
import { debugLog } from "../../../../utils/debug";

interface Document {
  id: string;
  name: string;
  holographId: string;
  type: string;
  filePath: string;
  notes: string | null;
  createdAt: string;
}

export default function VitalDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { currentHolographId, userId, isAuthenticated, isLoading: isHolographLoading } = useHolograph();
  
  // Use the holographId from the URL params
  const holographId = params.id as string;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch documents
  useEffect(() => {
    async function fetchDocuments() {
      if (!holographId || !userId) return;
      
      try {
        debugLog(`🚀 Fetching Vital Documents for Holograph ${holographId}`);
        
        // Use session-based authentication without URL parameters
        const response = await axios.get(`/api/vital-documents?holographId=${holographId}`, {
          withCredentials: true,
        });

        if (response.data.length > 0) {
          debugLog("✅ Retrieved Documents:", response.data);
          setDocuments(response.data);
        } else {
          console.warn("⚠️ No documents found.");
        }
      } catch (error) {
        console.error("❌ Error loading document:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId && holographId) {
      fetchDocuments();
    }
  }, [holographId, userId]);

  // Fetch signed URLs for documents
  useEffect(() => {
    async function fetchSignedUrls() {
      if (documents.length === 0) return;

      debugLog("🚀 Fetching signed URLs for documents...");

      const urls: { [key: string]: string } = {};
      for (const doc of documents) {
        try {
          // Use withCredentials to send authentication cookies
          const response = await axios.get(
            `/api/generate-signed-url?filePath=${encodeURIComponent(doc.filePath)}&holographId=${encodeURIComponent(holographId)}&section=vital-documents`,
            { withCredentials: true }
          );
          urls[doc.id] = response.data.url;
        } catch (error) {
          console.error(`❌ Error fetching signed URL for ${doc.name}:`, error);
        }
      }

      setSignedUrls(urls);
      debugLog("✅ Signed URLs retrieved:", urls);
    }

    if (documents.length > 0) {
      fetchSignedUrls();
    }
  }, [documents, holographId]);

  const openModal = (document: Document | null) => {
    debugLog("🟢 openModal triggered! Document:", document);
    if (document) {
      setSelectedDocument({ 
        ...document, 
        newFile: null,
        filePath: document.filePath || ""
      } as Document & { newFile?: File | null, filePath?: string });
    } else {
      setSelectedDocument(null);
    }
    setIsModalOpen(true);
    debugLog("🟢 isModalOpen set to TRUE");
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

  // Function to refresh documents
  const refreshDocuments = async () => {
    try {
      setIsLoading(true);
      debugLog(`🔄 Refreshing Vital Documents for Holograph ${holographId}`);
      
      const response = await axios.get(`/api/vital-documents?holographId=${holographId}`, {
        withCredentials: true,
      });

      if (response.data.length > 0) {
        debugLog("✅ Retrieved Documents:", response.data);
        setDocuments(response.data);
      } else {
        console.warn("⚠️ No documents found.");
      }
    } catch (error) {
      console.error("❌ Error loading documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || (isLoading && documents.length === 0)) return <p>Loading...</p>;
  if (status === 'unauthenticated') return <p>Please log in</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h1 className="text-3xl font-bold text-gray-800">Vital Documents</h1>
      <p className="text-gray-600 text-lg">Manage your important documents securely.</p>

      <div className="mt-6 flex gap-4">
        <button className="btn-primary" onClick={() => openModal(null)}>
          ➕ Add New Vital Document
        </button>
        <button
          onClick={() => router.push(`/holographs/${holographId}`)}
          className="btn-secondary"
        >
          ← Back to Holograph
        </button>
      </div>

      {isModalOpen && userId && (
        <VitalDocumentModal 
          userId={userId}
          document={selectedDocument}
          holographId={holographId} 
          onClose={closeModal}
          onSuccess={() => window.location.reload()} // Refresh after modal action
        />
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Documents</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-gray-500">No documents added yet.</p>
        ) : (
          <ul className="mt-4">
            {documents.map((doc) => (
              <li key={doc.id} className="p-4 bg-gray-50 border-b flex justify-between items-center rounded-lg shadow-sm hover:shadow-md transition">
                <div>
                  <a
                    href={signedUrls[doc.id] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {doc.name}
                  </a>
                  <p className="text-gray-600">{DOCUMENT_TYPES.vitalDocuments.find((d) => d.value === doc.type)?.label || doc.type}</p>
                  {doc.notes && <p className="text-gray-500 italic">Notes: {doc.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                    onClick={() => openModal(doc)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    onClick={() => handleDelete(doc.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}