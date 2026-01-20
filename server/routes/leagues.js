import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/leagues - Get all leagues with team counts
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        l.*,
        COUNT(DISTINCT t.id) as team_count,
        COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN p.id END) as player_count
      FROM leagues l
      LEFT JOIN teams t ON t.league_id = l.id
      LEFT JOIN players p ON p.team_id = t.id AND p.nationality = 'Morocco'
      GROUP BY l.id
      HAVING COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN p.id END) > 0
      ORDER BY COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN p.id END) DESC, l.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// GET /api/leagues/:id - Get single league with teams
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const leagueResult = await db.query(
      `SELECT l.*,
        COUNT(DISTINCT t.id) as team_count,
        COUNT(DISTINCT p.id) as player_count
       FROM leagues l
       LEFT JOIN teams t ON t.league_id = l.id
       LEFT JOIN players p ON p.team_id = t.id
       WHERE l.id = $1
       GROUP BY l.id`,
      [id]
    );

    if (leagueResult.rows.length === 0) {
      return res.status(404).json({ error: 'League not found' });
    }

    const teamsResult = await db.query(
      `SELECT t.*,
        COUNT(p.id) as player_count
       FROM teams t
       LEFT JOIN players p ON p.team_id = t.id
       WHERE t.league_id = $1
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [id]
    );

    res.json({
      ...leagueResult.rows[0],
      teams: teamsResult.rows
    });
  } catch (error) {
    console.error('Error fetching league:', error);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

export default router;
