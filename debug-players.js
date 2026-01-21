import { query } from './server/config/database.js';

const main = async () => {
  try {
    // First, get all teams that have Moroccan players
    const moroccanTeamsRes = await query(`
      SELECT DISTINCT team_id, t.name
      FROM players p
      JOIN teams t ON p.team_id = t.id
      WHERE p.nationality = 'Morocco'
      LIMIT 10
    `);
    
    console.log(`Teams with Moroccan players: ${moroccanTeamsRes.rows.length}\n`);
    
    for (const team of moroccanTeamsRes.rows) {
      console.log(`Team: ${team.name} (${team.team_id})`);
      
      // Check if this team has matches
      const matchesRes = await query(`
        SELECT COUNT(*) as count
        FROM matches
        WHERE home_team_id = $1 OR away_team_id = $1
      `, [team.team_id]);
      
      console.log(`  - Matches: ${matchesRes.rows[0].count}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

main();
