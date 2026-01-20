import express from 'express';
import { getMatchesByDate, getMatchesByLeague, getAllLeagues } from '../services/matchService.js';

const router = express.Router();

// GET /api/matches?date=today&league=ligue1
router.get('/', async (req, res) => {
  try {
    const { date, league } = req.query;

    let matches;
    if (league) {
      matches = await getMatchesByLeague(league);
    } else if (date) {
      matches = await getMatchesByDate(date);
    } else {
      matches = await getMatchesByDate('today');
    }

    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/leagues
router.get('/leagues', async (req, res) => {
  try {
    const leagues = await getAllLeagues();
    res.json({ success: true, data: leagues });
  } catch (error) {
    console.error('Error fetching leagues:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leagues' });
  }
});

export default router;
