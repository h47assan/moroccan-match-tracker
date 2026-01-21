import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

/**
 * Audit all player-team assignments
 * Check for orphaned players and duplicates
 */

async function auditPlayerTeams() {
  console.log('📊 COMPREHENSIVE PLAYER TEAM AUDIT\n');
  console.log('═'.repeat(70) + '\n');

  try {
    // 1. Get total player count
    const totalPlayers = await query('SELECT COUNT(*) as count FROM players WHERE nationality = \'Morocco\'');
    const playersWithTeams = await query('SELECT COUNT(*) as count FROM players WHERE nationality = \'Morocco\' AND team_id IS NOT NULL');
    const playersWithoutTeams = await query('SELECT COUNT(*) as count FROM players WHERE nationality = \'Morocco\' AND team_id IS NULL');

    console.log('📈 STATISTICS:\n');
    console.log(`   Total Moroccan Players: ${totalPlayers.rows[0].count}`);
    console.log(`   ✅ With Team Assignment: ${playersWithTeams.rows[0].count}`);
    console.log(`   ❌ WITHOUT Team Assignment: ${playersWithoutTeams.rows[0].count}\n`);

    // 2. Players without teams
    if (playersWithoutTeams.rows[0].count > 0) {
      console.log('⚠️  PLAYERS WITHOUT TEAMS:\n');
      const unassigned = await query(
        'SELECT id, name FROM players WHERE nationality = \'Morocco\' AND team_id IS NULL ORDER BY name'
      );

      unassigned.rows.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name}`);
      });
      console.log();
    }

    // 3. Players with appearances by team
    console.log('📊 TOP TEAMS BY MOROCCAN PLAYERS:\n');
    const teamStats = await query(`
      SELECT 
        t.name,
        COUNT(DISTINCT p.id) as player_count,
        COUNT(mp.id) as total_appearances,
        AVG(COUNT(mp.id)) OVER (PARTITION BY t.id) as avg_appearances_per_player
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id AND p.nationality = 'Morocco'
      LEFT JOIN match_players mp ON p.id = mp.player_id
      WHERE p.id IS NOT NULL
      GROUP BY t.id, t.name
      ORDER BY player_count DESC, total_appearances DESC
      LIMIT 15
    `);

    teamStats.rows.forEach((team, idx) => {
      console.log(`   ${idx + 1}. ${team.name.padEnd(30)} | ${team.player_count} players | ${team.total_appearances} appearances`);
    });
    console.log();

    // 4. Duplicate team entries check
    console.log('🔍 POTENTIAL DUPLICATE TEAMS:\n');
    const similarTeams = await query(`
      SELECT 
        LOWER(REGEXP_REPLACE(name, '[àáâãäå]', 'a', 'g')) as normalized,
        COUNT(*) as count,
        STRING_AGG(DISTINCT name, ' | ') as team_names
      FROM teams
      GROUP BY normalized
      HAVING COUNT(*) > 1
      LIMIT 10
    `);

    if (similarTeams.rows.length === 0) {
      console.log('   ✅ No duplicate team entries detected\n');
    } else {
      console.log('   ⚠️  Found potential duplicates:\n');
      similarTeams.rows.forEach((dup, idx) => {
        console.log(`   ${idx + 1}. ${dup.team_names}`);
      });
      console.log();
    }

    // 5. Saudi clubs verification (high priority)
    console.log('🇸🇦 SAUDI CLUBS VERIFICATION:\n');
    const saudiClubs = [
      'Al-Hilal Saudi FC',
      'Al-Ittihad FC',
      'Al-Ahli Jeddah',
      'Al-Qadisiyah FC'
    ];

    for (const clubName of saudiClubs) {
      const club = await query(
        'SELECT id FROM teams WHERE name ILIKE $1',
        [`%${clubName}%`]
      );

      if (club.rows.length > 0) {
        const clubId = club.rows[0].id;
        const players = await query(
          'SELECT p.name FROM players p WHERE p.team_id = $1 AND p.nationality = \'Morocco\'',
          [clubId]
        );

        if (players.rows.length > 0) {
          console.log(`   ${clubName}: ${players.rows.length} players`);
          players.rows.forEach(p => {
            console.log(`      • ${p.name}`);
          });
        } else {
          console.log(`   ${clubName}: 0 players`);
        }
      } else {
        console.log(`   ❌ ${clubName}: NOT FOUND IN DATABASE`);
      }
      console.log();
    }

    console.log('═'.repeat(70));
    console.log('✅ Audit complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

auditPlayerTeams();
