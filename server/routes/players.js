import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/players - Get all Moroccan players
router.get('/', async (req, res) => {
  try {
    const { leagueId } = req.query;
    
    console.log('🔍 Player filter request - leagueId:', leagueId, 'type:', typeof leagueId);
    
    let queryText = `
      SELECT 
        p.id,
        p.name,
        p.position,
        p.image_url as "imageUrl",
        p.date_of_birth as "dateOfBirth",
        p.market_value as "marketValue",
        p.nationality,
        json_build_object(
          'id', t.id,
          'name', t.name,
          'shortName', t.short_name,
          'logo', t.logo
        ) as team,
        json_build_object(
          'id', l.id,
          'name', l.name,
          'shortName', l.short_name,
          'country', l.country,
          'logo', l.logo
        ) as league
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN leagues l ON t.league_id = l.id
      WHERE p.nationality = 'Morocco'
    `;
    
    const params = [];
    if (leagueId) {
      params.push(leagueId);
      queryText += ` AND l.id = $1`;
    }
    
    queryText += ` ORDER BY p.name`;
    
    const result = await query(queryText, params);
    
    console.log(`📊 Found ${result.rows.length} players ${leagueId ? `in league ${leagueId}` : 'total'}`);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch players' });
  }
});

// GET /api/players/:id - Get single player
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        p.*,
        t.name as team_name,
        t.short_name as team_short_name,
        t.logo as team_logo,
        l.name as league_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN leagues l ON t.league_id = l.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch player' });
  }
});

export default router;
