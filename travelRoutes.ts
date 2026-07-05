import express from 'express';
import { searchFlightOffers } from './travelpayoutsClient';

export function createTravelRouter(requireRole: (roles: string[]) => express.RequestHandler) {
  const router = express.Router();
  const guard = requireRole(['Security', 'Master Admin', 'Admin']);

  router.get('/flight-offers', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { from, to, date, passengers } = req.query;
      if (!from || !to || !date) {
        return res.status(400).json({ message: 'from, to, and date are required' });
      }

      const offers = await searchFlightOffers({
        from: String(from).toUpperCase(),
        to: String(to).toUpperCase(),
        date: String(date),
        passengers: passengers ? Number(passengers) : 1,
      });

      res.json(offers);
    } catch (err: any) {
      console.error('Flight offers search failed:', err.message);
      res.status(502).json({ message: err.message || 'Failed to fetch flight offers' });
    }
  });

  return router;
}
