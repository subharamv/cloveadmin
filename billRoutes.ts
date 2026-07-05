import express from 'express';
import {
  listBills,
  createBill,
  updateBill,
  deleteBill,
  markBillPaid,
  listBillHistory,
  BillCategory,
} from './googleSheetsBills';

// The APEPDCL live-lookup routes (which depend on Playwright / a headless
// Chromium) live in billRoutesApepdcl.ts instead of here, and are only
// imported by server.ts for local dev. Bundlers can't reliably tree-shake a
// require() based on a runtime env var, so keeping that file out of this
// one's import graph entirely is what actually keeps Playwright out of the
// Netlify Function bundle — not just a feature flag.

const VALID_CATEGORIES: BillCategory[] = ['Mobile', 'Vehicle', 'Electricity'];

export function createBillRouter(requireRole: (roles: string[]) => express.RequestHandler) {
  const router = express.Router();
  const guard = requireRole(['Security', 'Master Admin', 'Admin']);

  router.get('/', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const category = req.query.category ? String(req.query.category) : undefined;
      if (category && !VALID_CATEGORIES.includes(category as BillCategory)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      const bills = await listBills(category as BillCategory | undefined);
      res.json(bills);
    } catch (err: any) {
      console.error('Failed to list bills:', err.message);
      res.status(500).json({ message: 'Failed to list bills' });
    }
  });

  router.post('/', guard, async (req: any, res: express.Response): Promise<any> => {
    try {
      const { category, subType, identifier, amount, frequency, dueDate, notes, label } = req.body;

      if (!category || !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'A valid category (Mobile, Vehicle, Electricity) is required' });
      }
      if (!identifier || amount === undefined || !frequency || !dueDate) {
        return res.status(400).json({ message: 'Identifier, amount, frequency, and due date are required' });
      }

      const bill = await createBill({
        category,
        subType: subType || '',
        identifier,
        amount: Number(amount),
        frequency,
        dueDate,
        notes: notes || '',
        createdBy: req.user?.email || req.user?.username || 'unknown',
        label: label || '',
      });

      res.status(201).json({ message: 'Bill created successfully', bill });
    } catch (err: any) {
      console.error('Failed to create bill:', err.message);
      res.status(500).json({ message: 'Failed to create bill' });
    }
  });

  router.put('/:billId', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { billId } = req.params;
      const { subType, identifier, amount, frequency, dueDate, notes, status, label } = req.body;

      const updated = await updateBill(billId, {
        subType,
        identifier,
        amount: amount !== undefined ? Number(amount) : undefined,
        frequency,
        dueDate,
        notes,
        status,
        label,
      });

      if (!updated) return res.status(404).json({ message: 'Bill not found' });
      res.json({ message: 'Bill updated successfully', bill: updated });
    } catch (err: any) {
      console.error('Failed to update bill:', err.message);
      res.status(500).json({ message: 'Failed to update bill' });
    }
  });

  router.delete('/:billId', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { billId } = req.params;
      const ok = await deleteBill(billId);
      if (!ok) return res.status(404).json({ message: 'Bill not found' });
      res.json({ message: 'Bill deleted successfully' });
    } catch (err: any) {
      console.error('Failed to delete bill:', err.message);
      res.status(500).json({ message: 'Failed to delete bill' });
    }
  });

  router.post('/:billId/pay', guard, async (req: any, res: express.Response): Promise<any> => {
    try {
      const { billId } = req.params;
      const { notes } = req.body;
      const paidBy = req.user?.email || req.user?.username || 'unknown';

      const result = await markBillPaid(billId, paidBy, notes);
      if (!result) return res.status(404).json({ message: 'Bill not found' });

      res.json({ message: 'Bill marked as paid', bill: result.bill, payment: result.payment });
    } catch (err: any) {
      console.error('Failed to mark bill as paid:', err.message);
      res.status(500).json({ message: 'Failed to mark bill as paid' });
    }
  });

  router.get('/history', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const category = req.query.category ? String(req.query.category) : undefined;
      if (category && !VALID_CATEGORIES.includes(category as BillCategory)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      const history = await listBillHistory();
      const filtered = category ? history.filter((p) => p.category === category) : history;
      res.json(filtered);
    } catch (err: any) {
      console.error('Failed to fetch bill history:', err.message);
      res.status(500).json({ message: 'Failed to fetch bill history' });
    }
  });

  router.get('/:billId/history', guard, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { billId } = req.params;
      const history = await listBillHistory(billId);
      res.json(history);
    } catch (err: any) {
      console.error('Failed to fetch bill history:', err.message);
      res.status(500).json({ message: 'Failed to fetch bill history' });
    }
  });

  return router;
}
