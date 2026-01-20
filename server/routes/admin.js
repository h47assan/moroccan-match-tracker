import express from 'express';
import { 
  fetchAllMoroccanPlayers, 
  syncPlayersToDatabase 
} from '../services/wikidataService.js';
import { query } from '../config/database.js';

const router = express.Router();

// POST /api/admin/sync-wikidata - Trigger Wikidata sync
router.post('/sync-wikidata', async (req, res) => {
  try {
    console.log('📥 Starting Wikidata sync...');
    
    const wikidataPlayers = await fetchAllMoroccanPlayers();
    const syncResults = await syncPlayersToDatabase(wikidataPlayers);
    
    res.json({ 
      success: true, 
      message: 'Wikidata sync completed',
      results: syncResults,
      totalFetched: wikidataPlayers.length
    });
  } catch (error) {
    console.error('Error syncing Wikidata:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync Wikidata players' 
    });
  }
});

// GET /api/admin/players - Get all players
router.get('/players', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, t.name as team_name, t.short_name as team_short_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ORDER BY p.name
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch players' });
  }
});

export default router;
