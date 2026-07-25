import { NextApiRequest, NextApiResponse } from 'next';
import { EventRepository } from '@kadarn/platform-services';

const eventRepository = new EventRepository();

// POST /api/v1/events
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const event = req.body;
        // Validate event object
        // Call repository to save event
        const savedEvent = await eventRepository.appendEvent(event);
        res.status(201).json(savedEvent);
    } else if (req.method === 'GET') {
        const { organization_id, limit = 50, offset = 0 } = req.query;
        const events = await eventRepository.fetchEvents(organization_id as string, Number(limit), Number(offset));
        res.status(200).json(events);
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}