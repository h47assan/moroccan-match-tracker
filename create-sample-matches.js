import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function createSampleMatches() {
  console.log('⚽ Creating sample matches for demonstration...\n');

  try {
    // Get some teams and leagues from the database
    const teamsResult = await query('SELECT id, name, league_id FROM teams LIMIT 20');
    const leaguesResult = await query('SELECT id FROM leagues LIMIT 5');
    
    if (teamsResult.rows.length < 4 || leaguesResult.rows.length < 1) {
      console.log('❌ Need at least 4 teams and 1 league in database');
      process.exit(1);
    }

    const teams = teamsResult.rows;
    const leagues = leaguesResult.rows;

    console.log(`Found ${teams.rows.length} teams and ${leagues.length} leagues\n`);

    // Create sample matches
    const matches = [];
    const now = new Date();
    
    // Today's matches
    matches.push({
      homeTeam: teams[0],
      awayTeam: teams[1],
      league: teams[0].league_id || leagues[0].id,
      kickoff: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      status: 'scheduled'
    });

    matches.push({
      homeTeam: teams[2],
      awayTeam: teams[3],
      league: teams[2].league_id || leagues[0].id,
      kickoff: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
      status: 'scheduled'
    });

    // Tomorrow's matches
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);

    if (teams.length >= 6) {
      matches.push({
        homeTeam: teams[4],
        awayTeam: teams[5],
        league: teams[4].league_id || leagues[0].id,
        kickoff: tomorrow,
        status: 'scheduled'
      });
    }

    // A live match
    if (teams.length >= 8) {
      matches.push({
        homeTeam: teams[6],
        awayTeam: teams[7],
        league: teams[6].league_id || leagues[0].id,
        kickoff: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
        status: 'live',
        homeScore: 1,
        awayScore: 1
      });
    }

    // A finished match
    if (teams.length >= 10) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(20, 0, 0, 0);
      
      matches.push({
        homeTeam: teams[8],
        awayTeam: teams[9],
        league: teams[8].league_id || leagues[0].id,
        kickoff: yesterday,
        status: 'finished',
        homeScore: 2,
        awayScore: 0
      });
    }

    console.log(`Creating ${matches.length} sample matches...\n`);

    for (const match of matches) {
      const matchId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await query(`
        INSERT INTO matches 
        (id, home_team_id, away_team_id, league_id, kickoff_time, status, home_score, away_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        matchId,
        match.homeTeam.id,
        match.awayTeam.id,
        match.league,
        match.kickoff,
        match.status,
        match.homeScore || null,
        match.awayScore || null
      ]);

      console.log(`✅ Created ${match.status} match: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

      // Link Moroccan players from both teams
      const playersResult = await query(`
        SELECT id FROM players 
        WHERE (team_id = $1 OR team_id = $2) 
        AND nationality = 'Morocco'
        LIMIT 3
      `, [match.homeTeam.id, match.awayTeam.id]);

      for (const player of playersResult.rows) {
        await query(`
          INSERT INTO match_players (match_id, player_id)
          VALUES ($1, $2)
        `, [matchId, player.id]);
      }

      if (playersResult.rows.length > 0) {
        console.log(`   🇲🇦 Linked ${playersResult.rows.length} Moroccan player(s)`);
      }
    }

    console.log('\n✅ Sample matches created successfully!');
    console.log('\n💡 Your matches page should now display these demo matches');
    console.log('💡 Restart the backend server to see the updates\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createSampleMatches();
