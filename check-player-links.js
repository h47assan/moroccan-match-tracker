import { query } from './server/config/database.js';

(async () => {
  try {
    const mp = await query('SELECT COUNT(*) as count FROM match_players');
    console.log('Total player-match links:', mp.rows[0].count);
    
    const matches = await query('SELECT COUNT(DISTINCT match_id) as count FROM match_players');
    console.log('Matches with Moroccan players:', matches.rows[0].count);
    
    const sample = await query(`
      SELECT m.id, ht.name as home, at.name as away, COUNT(mp.player_id) as player_count
      FROM matches m
      JOIN match_players mp ON m.id = mp.match_id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      GROUP BY m.id, ht.name, at.name
      ORDER BY player_count DESC
      LIMIT 5
    `);
    
    console.log('\nTop 5 matches with most Moroccan players:');
    sample.rows.forEach(r => {
      console.log(`  ${r.home} vs ${r.away}: ${r.player_count} players`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
})();
