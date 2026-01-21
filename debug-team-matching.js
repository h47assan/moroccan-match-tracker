import { query } from './server/config/database.js';

(async () => {
  try {
    // Get a sample match
    const matches = await query(`
      SELECT m.id, ht.name as home_name, at.name as away_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LIMIT 3
    `);
    
    console.log('Sample matches from API-Football:');
    matches.rows.forEach(m => {
      console.log(`  ${m.home_name} vs ${m.away_name}`);
    });
    
    // Get sample teams with Moroccan players
    const teams = await query(`
      SELECT t.name, t.short_name, COUNT(p.id) as player_count
      FROM teams t
      JOIN players p ON p.team_id = t.id
      WHERE p.nationality = 'Morocco'
      GROUP BY t.id, t.name, t.short_name
      ORDER BY player_count DESC
      LIMIT 10
    `);
    
    console.log('\nTop 10 teams with Moroccan players (from Wikidata):');
    teams.rows.forEach(t => {
      console.log(`  ${t.name} (${t.short_name}): ${t.player_count} players`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
})();
