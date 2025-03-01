// /src/app/holographs/[id]/vital-documents/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation"; // ✅ Use `useSearchParams`
import axios from "axios";
import VitalDocumentModal from "../../../_components/vital-documents/VitalDocumentModal";
import { DOCUMENT_TYPES } from "../../../../config/documentType";

interface Document {
  id: string;
  name: string;
  holographId: string; // ✅ Ensure this field is included
  type: string;
  filePath: string;
  notes: string | null;
  createdAt: string;
}

export default function VitalDocumentsPage() {
  const params = useParams();
  const searchParams = useSearchParams(); // ✅ Extract query parameters
  const router = useRouter();
  const holographId = params.id as string;
  
  // ✅ Extract userId from query params
  const userId = searchParams.get("userId") || null;

  const [documents, setDocuments] = useState<Document[]>([]); // ✅ Supports multiple documents
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Debugging logs to ensure userId is received
  useEffect(() => {
    if (!userId) {
      console.error("❌ No user ID found in query params. Redirecting to login.");
      router.push("/login");
      return;
    } else {
      console.log("✅ User ID found in query params:", userId);
    }
  }, [userId, router]);

  // ✅ Fetch multiple documents for the given holograph
  useEffect(() => {
    async function fetchDocuments() {
      try {
        console.log(`🚀 Fetching Vital Documents for Holograph ${holographId} and User ${userId}`);
        
        const response = await axios.get(`/api/vital-documents?holographId=${holographId}`, {
          withCredentials: true, // ✅ Ensure cookies are sent
        });

        if (response.data.length > 0) {
          console.log("✅ Retrieved Documents:", response.data);
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

    if (userId) {
      fetchDocuments();
    }
  }, [holographId, userId]);

  // ✅ Fetch signed URLs for all documents
  useEffect(() => {
    async function fetchSignedUrls() {
      if (documents.length === 0) return; // ✅ Prevents fetching if no documents exist

      console.log("🚀 Fetching signed URLs for documents...");

      const urls: { [key: string]: string } = {};
      for (const doc of documents) {
        try {
          const response = await axios.get(
            `/api/generate-signed-url?filePath=${encodeURIComponent(doc.filePath)}&holographId=${encodeURIComponent(holographId)}&section=vital-documents`,
            { withCredentials: true }
          );
          urls[doc.id] = response.data.url;
        } catch (error) {
          console.error(`❌ Error fetching signed URL for ${doc.name}:`, error);
        }
      }

      setSignedUrls(urls); // ✅ Store signed URLs for each document
      console.log("✅ Signed URLs retrieved:", urls);
    }

    if (documents.length > 0) {
      fetchSignedUrls();
    }
  }, [documents]);

  const openModal = (document: Document | null) => {
    console.log("🟢 openModal triggered! Document:", document); // ✅ Debug log
    if (document) {
      setSelectedDocument({ 
        ...document, 
        newFile: null,  // ✅ No new file initially
        filePath: document.filePath || "" // ✅ Ensure filePath is passed
      } as Document & { newFile?: File | null, filePath?: string });
    } else {
      setSelectedDocument(null);
    }
    setIsModalOpen(true);
    console.log("🟢 isModalOpen set to TRUE"); // ✅ Debug log
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

  // Function to refresh documents so users can see what was just changed (added, edited, etc)
const refreshDocuments = async () => {
  try {
    setIsLoading(true);
    console.log(`🔄 Refreshing Vital Documents for Holograph ${holographId}`);
    
    const response = await axios.get(`/api/vital-documents?holographId=${holographId}`, {
      withCredentials: true,
    });

    if (response.data.length > 0) {
      console.log("✅ Retrieved Documents:", response.data);
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Vital Documents</h1>
      <p className="text-gray-600">Manage your important documents securely.</p>

      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => openModal(null)}>Add New Vital Document</button>
      {isModalOpen && (
        <VitalDocumentModal 
          userId={userId || "UNKNOWN_USER"}
          document={selectedDocument}
          holographId={holographId} 
          onClose={closeModal}
          onSuccess={refreshDocuments} // Add this line
        />
      )}

      {/* ✅ Debugging Info */}
      <pre className="bg-gray-100 p-2">User ID: {userId}</pre>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Your Documents</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : documents.length === 0 ? (
          <p>No documents added yet.</p>
        ) : (
          <ul>
            {documents.map((doc) => ( // ✅ Loop through each document
              <li key={doc.id} className="p-2 border-b flex justify-between">
                <div>
                  <a
                    href={signedUrls[doc.id] || "#"} // ✅ Uses signed URL for each document
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    {doc.name}
                  </a>{" "}
                  - {DOCUMENT_TYPES.vitalDocuments.find((d) => d.value === doc.type)?.label || doc.type}

                  {doc.notes && <p className="text-gray-600 italic">Notes: {doc.notes}</p>}
                </div>
                <div>
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mx-2"
                    onClick={() => openModal(doc)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleDelete(doc.id)}
                  >
                    Delete
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
