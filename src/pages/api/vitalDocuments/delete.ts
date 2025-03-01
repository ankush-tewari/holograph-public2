import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { deleteFileFromGCS } from '@/lib/gcs';
import { debugLog } from "../../../utils/debug";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId } = req.body;

    if (!documentId) {
      console.error('❌ Missing documentId in request.');
      return res.status(400).json({ error: 'Missing documentId' });
    }

    // ✅ Find the document in Prisma
    const document = await prisma.vitalDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      console.error('❌ Document not found:', documentId);
      return res.status(404).json({ error: 'Document not found' });
    }

    // ✅ Delete the file from Google Cloud Storage
    if (document.filePath) {
      await deleteFileFromGCS(document.filePath);
    }

    // ✅ Delete the document from the database
    await prisma.vitalDocument.delete({ where: { id: documentId } });

    debugLog('✅ Document successfully deleted:', documentId);
    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
}
