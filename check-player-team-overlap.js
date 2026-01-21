import { query } from './server/config/database.js';

const main = async () => {
  try {
    const res = await query(`
      SELECT COUNT(*) as count_no_team, 
             (SELECT COUNT(*) FROM players WHERE nationality = 'Morocco') as total_moroccan,
             (SELECT COUNT(DISTINCT team_id) FROM players WHERE nationality = 'Morocco') as teams_with_moroccan
      FROM players 
      WHERE team_id IS NULL AND nationality = 'Morocco'
    `);
    
    console.log('Player Stats:');
    console.log('- Moroccan players without team:', res.rows[0].count_no_team);
    console.log('- Total Moroccan players:', res.rows[0].total_moroccan);
    console.log('- Teams with Moroccan players:', res.rows[0].teams_with_moroccan);
    
    // Check teams in matches
    const teamRes = await query(`
      SELECT COUNT(DISTINCT home_team_id) as home_teams,
             COUNT(DISTINCT away_team_id) as away_teams
      FROM matches
    `);
    
    console.log('\nMatch Stats:');
    console.log('- Unique home teams in matches:', teamRes.rows[0].home_teams);
    console.log('- Unique away teams in matches:', teamRes.rows[0].away_teams);
    
    // Check if there's any overlap
    const overlapRes = await query(`
      SELECT COUNT(*) as teams_in_both
      FROM (
        SELECT DISTINCT t.id FROM teams t
        WHERE t.id IN (SELECT home_team_id FROM matches) OR t.id IN (SELECT away_team_id FROM matches)
        AND t.id IN (SELECT team_id FROM players WHERE nationality = 'Morocco')
      ) sub
    `);
    
    console.log('- Teams that both have Moroccan players AND play matches:', overlapRes.rows[0].teams_in_both);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

main();
