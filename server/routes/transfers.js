import express from 'express';
import { getAllTransfers, getTransfersByLeague } from '../services/transferService.js';

const router = express.Router();

// GET /api/transfers?league=ligue1
router.get('/', async (req, res) => {
  try {
    const { league } = req.query;

    const transfers = league 
      ? await getTransfersByLeague(league)
      : await getAllTransfers();

    res.json({ success: true, data: transfers });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transfers' });
  }
});

export default router;
