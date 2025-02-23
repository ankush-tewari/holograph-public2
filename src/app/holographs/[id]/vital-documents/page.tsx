//// /src/app/holographs/[id]/vital-documents/page.tsx - Vital documents detail page

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

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

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Will');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await axios.get(`/api/vitalDocuments/${holographId}`);
        setDocuments(response.data);
      } catch (err) {
        setError('Failed to load vital documents.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [holographId]);

  async function handleAddDocument() {
    if (!name.trim() || !file) {
      alert('Please enter a document name and select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('holographId', holographId);
    formData.append('userId', 'CURRENT_USER_ID'); // Replace with actual logged-in user ID
    formData.append('name', name);
    formData.append('type', type);
    formData.append('notes', notes); // ✅ Include notes in the upload
    formData.append('file', file);

    try {
      const response = await axios.post('/api/vitalDocuments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocuments([...documents, response.data]);
      setName('');
      setType('Will');
      setNotes(''); // ✅ Clear the notes field after upload
      setFile(null);
      alert('Document uploaded successfully!');
    } catch (error) {
      alert('Error uploading document.');
      console.error(error);
    }
  }
  async function handleDeleteDocument(documentId: string) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
  
    try {
      const response = await axios.delete('/api/vitalDocuments/delete', {
        data: { documentId },
      });
  
      if (response.status === 200) {
        alert('Document deleted successfully!');
        setDocuments((prevDocuments) => prevDocuments.filter((doc) => doc.id !== documentId));
      } else {
        alert('Failed to delete document.');
      }
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      alert('An error occurred while deleting the document.');
    }
  }
  

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Vital Documents</h1>
      <p className="text-gray-600">Upload and manage important documents securely.</p>

      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => router.push(`/holographs/${holographId}`)}>
        Back to Holograph
      </button>

      {/* Document List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Your Documents</h2>
        {documents.length === 0 ? <p>No documents added yet.</p> : (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id} className="p-2 border-b">
                <a href={doc.filePath} target="_blank" className="text-blue-500 underline">{doc.name}</a> - {doc.type}
                {doc.notes && <p className="text-gray-600 italic">Notes: {doc.notes}</p>}
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upload Form */}
      <div className="mt-6 border-t pt-4">
        <h2 className="text-lg font-semibold">Add a New Document</h2>
        <input type="text" placeholder="Document Name" value={name} onChange={(e) => setName(e.target.value)} className="border p-2 mt-2 w-full" />
        
        <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2 mt-2 w-full">
          <option value="Will">Will</option>
          <option value="Trust">Trust</option>
          <option value="Advanced Health Directive">Advanced Health Directive</option>
          <option value="Other">Other</option>
        </select>

        {/* ✅ New Notes Field */}
        <textarea 
          placeholder="Add notes or instructions (optional)" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          className="border p-2 mt-2 w-full"
          rows={4}
        />

        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border p-2 mt-2 w-full" />
        
        <button onClick={handleAddDocument} className="bg-green-500 text-white px-4 py-2 mt-4 rounded">
          Upload Document
        </button>
      </div>
    </div>
  );
}
