import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { prisma } from '@/lib/db';
import { uploadFileToGCS } from '@/lib/gcs';

export const config = {
  api: { bodyParser: false }, // ✅ Required for handling file uploads
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('➡️ Incoming request to upload a file:', req.method);

  if (req.method !== 'POST') {
    console.error('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Formidable error:', err);
      return res.status(500).json({ error: 'File upload failed' });
    }

    console.log('🟢 Parsed form fields:', fields);
    console.log('🟢 Parsed files:', files);

    const { holographId, userId, name, type, notes } = fields;
    const file = files.file?.[0];

    if (!file || !holographId || !userId || !name || !type) {
      console.error('❌ Missing required fields:', { holographId, userId, name, type, file });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      console.log('🔄 Uploading file to Google Cloud Storage...');
      
      // ✅ Get only the object name (not the signed URL)
      const gcsFileName = `uploads/${Date.now()}-${file.originalFilename}`;
      const fileUrl = await uploadFileToGCS(file, gcsFileName);

      console.log('✅ File uploaded successfully:', gcsFileName);

      console.log('🔄 Saving file details in database...');
      const newDocument = await prisma.vitalDocument.create({
        data: {
          holographId: Array.isArray(holographId) ? holographId[0] : holographId,
          name: Array.isArray(name) ? name[0] : name,
          type: Array.isArray(type) ? type[0] : type,
          filePath: gcsFileName, // ✅ Store only the object name
          uploadedBy: Array.isArray(userId) ? userId[0] : userId,
          notes: notes ? (Array.isArray(notes) ? notes[0] : notes) : null,
        },
      });

      console.log('✅ File metadata saved:', newDocument);
      return res.status(201).json(newDocument);
    } catch (error) {
      console.error('❌ Upload processing error:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  });
}
