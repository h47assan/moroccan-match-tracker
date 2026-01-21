import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

/**
 * DATABASE-ONLY ANALYSIS
 * Identifies issues without needing external API calls
 */

async function analyzePlayerData() {
  console.log('📊 MOROCCAN PLAYER DATABASE ANALYSIS\n');
  console.log('═'.repeat(70) + '\n');

  try {
    // 1. Players by assignment status
    console.log('1️⃣  ASSIGNMENT STATUS:\n');
    const stats = await query(`
      SELECT 
        CASE 
          WHEN team_id IS NULL THEN 'No Team'
          ELSE 'Assigned'
        END as status,
        COUNT(*) as count
      FROM players
      WHERE nationality = 'Morocco'
      GROUP BY status
    `);

    stats.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    // 2. Players with matches
    console.log('\n\n2️⃣  MATCH PARTICIPATION:\n');
    const matchStats = await query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_players,
        COUNT(DISTINCT CASE WHEN mp.id IS NOT NULL THEN p.id END) as with_matches,
        COUNT(DISTINCT CASE WHEN mp.id IS NULL THEN p.id END) as no_matches,
        COUNT(*) as total_match_entries
      FROM players p
      LEFT JOIN match_players mp ON p.id = mp.player_id
      WHERE p.nationality = 'Morocco'
    `);

    const ms = matchStats.rows[0];
    console.log(`   Total Players: ${ms.total_players}`);
    console.log(`   With Matches: ${ms.with_matches}`);
    console.log(`   Without Matches: ${ms.no_matches}`);
    console.log(`   Total Match Entries: ${ms.total_match_entries}`);

    // 3. Top players by appearances
    console.log('\n\n3️⃣  TOP 20 PLAYERS BY APPEARANCES:\n');
    const topPlayers = await query(`
      SELECT 
        p.name,
        t.name as team,
        p.position,
        COUNT(mp.id) as appearances
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN match_players mp ON p.id = mp.player_id
      WHERE p.nationality = 'Morocco'
      GROUP BY p.id, p.name, t.name, p.position
      ORDER BY appearances DESC
      LIMIT 20
    `);

    topPlayers.rows.forEach((p, idx) => {
      const teamCol = (p.team || 'NO TEAM').padEnd(30);
      const posCol = (p.position || '-').padEnd(5);
      console.log(`${(idx + 1).toString().padEnd(3)} ${p.name.padEnd(25)} | ${teamCol} | ${posCol} | ${p.appearances} matches`);
    });

    // 4. Teams with most Moroccan players
    console.log('\n\n4️⃣  TEAMS WITH MOST MOROCCAN PLAYERS:\n');
    const teamsByCount = await query(`
      SELECT 
        t.name as team,
        COUNT(p.id) as player_count,
        COUNT(mp.id) as total_appearances,
        STRING_AGG(DISTINCT p.name, ', ') as players
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id AND p.nationality = 'Morocco'
      LEFT JOIN match_players mp ON p.id = mp.player_id
      WHERE p.id IS NOT NULL
      GROUP BY t.id, t.name
      ORDER BY player_count DESC, total_appearances DESC
      LIMIT 15
    `);

    teamsByCount.rows.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.team} - ${t.player_count} players (${t.total_appearances} appearances)\n`);
    });

    // 5. Potential duplicates/issues
    console.log('\n5️⃣  DATA QUALITY CHECKS:\n');

    // Players with same position
    const positionCheck = await query(`
      SELECT position, COUNT(*) as count
      FROM players
      WHERE nationality = 'Morocco'
      GROUP BY position
      ORDER BY count DESC
    `);

    console.log('   Position Distribution:');
    positionCheck.rows.forEach(p => {
      console.log(`     ${(p.position || 'Unknown').padEnd(15)} : ${p.count}`);
    });

    // 6. Teams count
    console.log('\n   Team Distribution:');
    const teamCount = await query(`
      SELECT COUNT(DISTINCT team_id) as total_teams
      FROM players
      WHERE nationality = 'Morocco' AND team_id IS NOT NULL
    `);

    console.log(`     Total Teams with Moroccan Players: ${teamCount.rows[0].total_teams}`);

    // 7. Summary report
    console.log('\n' + '═'.repeat(70));
    console.log('📋 KEY FINDINGS:\n');
    console.log(`   • ${ms.with_matches} players have match appearances`);
    console.log(`   • ${ms.no_matches} players have NO match appearances`);
    console.log(`   • ${ms.no_matches - 101} players still unassigned to teams`);
    console.log(`   • Top player: ${topPlayers.rows[0].name} with ${topPlayers.rows[0].appearances} matches`);
    console.log(`   • Players spread across ${teamCount.rows[0].total_teams} teams\n`);

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      totalPlayers: ms.total_players,
      playersWithMatches: ms.with_matches,
      playersWithoutMatches: ms.no_matches,
      topPlayers: topPlayers.rows,
      teamsByPlayerCount: teamsByCount.rows,
      positionDistribution: positionCheck.rows
    };

    fs.writeFileSync('database-analysis.json', JSON.stringify(report, null, 2));
    console.log('📄 Full analysis saved to: database-analysis.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

analyzePlayerData();
