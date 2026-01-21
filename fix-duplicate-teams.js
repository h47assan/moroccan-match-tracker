import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

/**
 * Fix duplicate team entries and reassign players correctly
 * This script consolidates duplicate team records and fixes player assignments
 */

async function fixDuplicateTeams() {
  console.log('🔧 Consolidating duplicate team entries...\n');

  const teamMappings = [
    {
      canonical: 'Al-Hilal Saudi FC',
      duplicates: ['Al-Hilal', 'al hilal'],
      issue: 'Multiple entries for Saudi Al-Hilal'
    },
    {
      canonical: 'Al-Ahli Jeddah',
      duplicates: ['Al Ahli FC', 'Al-Ahli'],
      issue: 'Multiple entries for Saudi Al-Ahli'
    }
  ];

  let totalFixed = 0;

  for (const mapping of teamMappings) {
    console.log(`\n📌 Processing: ${mapping.canonical}`);
    console.log(`   Issue: ${mapping.issue}`);

    try {
      // Get the canonical team
      const canonicalTeam = await query(
        'SELECT id FROM teams WHERE name = $1 OR name LIKE $2',
        [mapping.canonical, `%${mapping.canonical}%`]
      );

      if (canonicalTeam.rows.length === 0) {
        console.log(`   ⚠️  Canonical team "${mapping.canonical}" not found`);
        continue;
      }

      const canonicalTeamId = canonicalTeam.rows[0].id;
      console.log(`   ✅ Found canonical team (ID: ${canonicalTeamId})`);

      // Find and consolidate duplicates
      for (const duplicate of mapping.duplicates) {
        const duplicateTeam = await query(
          'SELECT id, name FROM teams WHERE LOWER(name) LIKE LOWER($1)',
          [`%${duplicate}%`]
        );

        for (const dupTeam of duplicateTeam.rows) {
          if (dupTeam.id === canonicalTeamId) continue; // Skip if same as canonical

          console.log(`   🔄 Consolidating: ${dupTeam.name} (ID: ${dupTeam.id})`);

          // Get all players assigned to this duplicate team
          const players = await query(
            'SELECT id, name FROM players WHERE team_id = $1',
            [dupTeam.id]
          );

          // Reassign them to canonical team
          const updateResult = await query(
            'UPDATE players SET team_id = $1 WHERE team_id = $2',
            [canonicalTeamId, dupTeam.id]
          );

          if (players.rows.length > 0) {
            console.log(`      ➜ Reassigned ${players.rows.length} players:`);
            players.rows.forEach(p => {
              console.log(`         • ${p.name}`);
              totalFixed++;
            });
          }

          // Delete the duplicate team
          try {
            await query(
              'DELETE FROM teams WHERE id = $1',
              [dupTeam.id]
            );
            console.log(`      ✅ Deleted duplicate team`);
          } catch (deleteErr) {
            console.log(`      ⚠️  Could not delete (may have constraints): ${deleteErr.message}`);
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Fixed player team assignments: ${totalFixed}`);
  console.log('═'.repeat(60) + '\n');

  // Show final team status
  console.log('📊 Final team status for Saudi clubs:\n');
  const finalTeams = await query(
    `SELECT 
      t.id,
      t.name,
      COUNT(p.id) as player_count
     FROM teams t
     LEFT JOIN players p ON t.id = p.team_id
     WHERE t.name ILIKE '%hilal%' OR t.name ILIKE '%ahli%'
     GROUP BY t.id, t.name
     ORDER BY t.name`
  );

  finalTeams.rows.forEach(team => {
    console.log(`${team.name}: ${team.player_count} players`);
  });

  process.exit(0);
}

fixDuplicateTeams().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
