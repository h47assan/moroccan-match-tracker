import express from 'express';
import { getMatchesByDate, getMatchesByLeague, getAllLeagues } from '../services/matchService.js';
import { syncMoroccanPlayerFixtures, getLiveFixtures } from '../services/apiFootballService.js';

const router = express.Router();

// GET /api/matches?date=today&league=ligue1
router.get('/', async (req, res) => {
  try {
    console.log('API: Fetching matches with query:', req.query);
    const { date, league } = req.query;

    let matches;
    if (league) {
      matches = await getMatchesByLeague(league);
    } else if (date) {
      matches = await getMatchesByDate(date);
    } else {
      matches = await getMatchesByDate('today');
    }

    console.log('API: Fetched', matches.length, 'matches');
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

// POST /api/matches/sync - Sync upcoming matches from API-Football
router.post('/sync', async (req, res) => {
  try {
    console.log('📡 API: Starting match sync from API-Football...');
    const results = await syncMoroccanPlayerFixtures();
    res.json({ 
      success: true, 
      message: 'Matches synced successfully',
      data: results 
    });
  } catch (error) {
    console.error('Error syncing matches:', error);
    res.status(500).json({ success: false, error: 'Failed to sync matches' });
  }
});

// GET /api/matches/live - Get live matches from API-Football
router.get('/live', async (req, res) => {
  try {
    console.log('🔴 API: Fetching live matches from API-Football...');
    const liveFixtures = await getLiveFixtures();
    res.json({ 
      success: true, 
      data: liveFixtures 
    });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch live matches' });
  }
});

export default router;
