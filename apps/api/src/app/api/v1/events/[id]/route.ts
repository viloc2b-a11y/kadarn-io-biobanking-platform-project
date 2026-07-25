import { NextApiRequest, NextApiResponse } from 'next';
import { EventRepository } from '@kadarn/platform-services';

const eventRepository = new EventRepository();

// GET single event
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const event = await eventRepository.fetchEventById(id as string);
    if (event) {
        res.status(200).json(event);
    } else {
        res.status(404).end();
    }
}