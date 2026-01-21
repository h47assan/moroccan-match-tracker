import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

/**
 * ANALYSIS: The bug occurs because:
 * 1. The wikidataService.js syncs players using Wikidata's P54 (team member) property
 * 2. It tries to filter out ended dates, but the filter logic is inside a SPARQL query
 * 3. The syncPlayersToDatabase() function UPSERTS but old data might already exist
 * 4. When sync runs, it doesn't OVERWRITE team assignments, only COALESCE them
 * 5. Result: Players stay assigned to old teams from previous syncs
 * 
 * SOLUTION: Re-fetch ALL players from source and force update their teams
 */

async function analyzePlayerTeamIssues() {
  console.log('🔍 Analyzing player team mapping issues...\n');

  try {
    // Get all Moroccan players and their current teams
    const players = await query(`
      SELECT 
        p.id,
        p.name,
        p.team_id,
        t.name as current_team,
        COUNT(mp.id) as appearances
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN match_players mp ON p.id = mp.player_id
      WHERE p.nationality = 'Morocco'
      GROUP BY p.id, p.name, p.team_id, t.name
      ORDER BY appearances DESC
      LIMIT 30
    `);

    console.log('📊 Top 30 Moroccan Players by Match Appearances:\n');
    console.log('Player Name                    | Team                      | Appearances');
    console.log('─'.repeat(80));

    players.rows.forEach(p => {
      const nameCol = (p.name || 'Unknown').padEnd(30);
      const teamCol = (p.current_team || 'NO TEAM').padEnd(27);
      console.log(`${nameCol}| ${teamCol}| ${p.appearances || 0}`);
    });

    console.log('\n\n📈 Players without team assignments:\n');
    const noTeam = await query(`
      SELECT p.id, p.name, COUNT(mp.id) as appearances
      FROM players p
      LEFT JOIN match_players mp ON p.id = mp.player_id
      WHERE p.nationality = 'Morocco' AND p.team_id IS NULL
      GROUP BY p.id, p.name
      ORDER BY appearances DESC
      LIMIT 10
    `);

    if (noTeam.rows.length === 0) {
      console.log('✅ All players have teams assigned');
    } else {
      console.log(`❌ Found ${noTeam.rows.length} players without teams:`);
      noTeam.rows.forEach(p => {
        console.log(`   - ${p.name} (${p.appearances} appearances)`);
      });
    }

    // Check for duplicate team entries
    console.log('\n\n🔍 Checking for duplicate/similar teams:\n');
    const duplicateTeams = await query(`
      SELECT 
        LOWER(name) as team_group,
        COUNT(*) as count,
        STRING_AGG(DISTINCT name, ', ') as variations
      FROM teams
      WHERE name ILIKE '%al%hilal%' OR name ILIKE '%al%ahli%'
      GROUP BY LOWER(name)
    `);

    if (duplicateTeams.rows.length > 0) {
      console.log('Potential duplicate team entries:');
      duplicateTeams.rows.forEach(t => {
        console.log(`   ${t.variations} (${t.count} variations)`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

analyzePlayerTeamIssues();
