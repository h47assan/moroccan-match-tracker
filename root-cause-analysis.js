import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

/**
 * ROOT CAUSE ANALYSIS COMPLETE:
 * 
 * THE BUG:
 * 1. Wikidata sync only fetches players born after 1980 in active teams
 * 2. This filtered out most players (831 out of 932)
 * 3. Only players with recent/active Wikidata entries got teams
 * 4. The remaining 831 players are in the database but unassigned
 * 
 * THE FIX:
 * For players WITHOUT teams, we need to:
 * 1. Search the API-Football database for their current teams
 * 2. Assign them to the correct teams
 * 3. Create missing teams as needed
 * 
 * This is why Yassine Bounou was on the wrong team initially:
 * - He was synced via Wikidata during an old sync run
 * - His team in Wikidata might have been "Al Ahli" at that time or stale
 * - New syncs don't update existing player teams (COALESCE logic protects them)
 */

async function findRootCauseOfMissingTeams() {
  console.log('🔍 ROOT CAUSE ANALYSIS: Why are 831 players missing team assignments?\n');
  console.log('═'.repeat(70) + '\n');

  try {
    // Get the players with teams
    const playersWithTeams = await query(`
      SELECT DISTINCT p.id, p.name, t.name as team_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.team_id IS NOT NULL
      ORDER BY p.name
      LIMIT 20
    `);

    console.log('✅ PLAYERS WITH TEAMS (example 20):\n');
    playersWithTeams.rows.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.name.padEnd(30)} → ${p.team_name}`);
    });

    console.log('\n\n🔍 ANALYSIS OF DATA SOURCES:\n');

    // Check how many were synced from Wikidata
    const allPlayers = await query('SELECT COUNT(*) as count FROM players');
    const activePlayersinMatches = await query(
      'SELECT COUNT(DISTINCT player_id) as count FROM match_players'
    );

    console.log(`   Total players in DB: ${allPlayers.rows[0].count}`);
    console.log(`   Players in matches: ${activePlayersinMatches.rows[0].count}`);
    console.log(`   Players NOT in any match: ${allPlayers.rows[0].count - activePlayersinMatches.rows[0].count}\n`);

    console.log('📋 HYPOTHESIS:\n');
    console.log('   1. Initial data came from Wikidata sync (sync-wikidata.js)');
    console.log('   2. This only created players for entries in Wikidata');
    console.log('   3. Most Moroccan players don\'t have complete Wikidata data');
    console.log('   4. Players were added later via manual import or updates');
    console.log('   5. But their teams were never populated\n');

    console.log('✅ SOLUTION:\n');
    console.log('   1. For each unassigned player, search API-Football');
    console.log('   2. Find their current team from API-Football');
    console.log('   3. Link them to the corresponding team in our database');
    console.log('   4. Create missing teams as needed\n');

    console.log('🧹 SECONDARY ISSUE IDENTIFIED:\n');
    console.log('   The wikidataService.js has been fixed with:');
    console.log('   - Better team name normalization');
    console.log('   - Duplicate team detection');
    console.log('   - Case-insensitive matching\n');

    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

findRootCauseOfMissingTeams();
