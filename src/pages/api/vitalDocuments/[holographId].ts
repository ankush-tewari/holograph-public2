// src/app/holographs/[id]/vital-documents/[holographId.ts]

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db'; // ✅ Corrected Prisma import

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { holographId } = req.query;

  if (req.method === 'GET') {
    try {
      const documents = await prisma.vitalDocument.findMany({
        where: { holographId: holographId as string },
      });

      return res.status(200).json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ error: 'Error fetching vital documents' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
