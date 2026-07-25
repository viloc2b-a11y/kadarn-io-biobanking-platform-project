import { NextApiRequest, NextApiResponse } from 'next';
import { LineageService } from '@kadarn/platform-services';

const lineageService = new LineageService();

// GET /api/v1/lineage?evidence_id=X or GET /api/v1/lineage?claim_id=X
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

    const { evidence_id, claim_id } = req.query;

    if (!evidence_id && !claim_id) {
        res.status(400).json({ error: 'Either evidence_id or claim_id query parameter is required' });
        return;
    }

    try {
        const id = (evidence_id || claim_id) as string;
        const useClaimId = !!claim_id;
        const lineage = await lineageService.getLineage(id, useClaimId);
        res.status(200).json(lineage);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Internal Server Error', detail: message });
    }
}
