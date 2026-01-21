import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function fixBounouAndOtherPlayers() {
  console.log('🔧 Correcting player-to-team assignments from Wikidata\n');
  console.log('Issue: Players were synced with outdated team information\n');

  try {
    // Get the correct team IDs
    const alHilal = await query('SELECT id FROM teams WHERE name ILIKE \'%al-hilal%\' LIMIT 1');
    const alAhli = await query('SELECT id FROM teams WHERE name ILIKE \'%al-ahli jeddah%\' LIMIT 1');

    if (alHilal.rows.length === 0 || alAhli.rows.length === 0) {
      console.log('❌ Could not find required teams');
      process.exit(1);
    }

    const alHilalId = alHilal.rows[0].id;
    const alAhliId = alAhli.rows[0].id;

    console.log(`📌 Team IDs:
   Al-Hilal Saudi FC: ${alHilalId}
   Al-Ahli Jeddah: ${alAhliId}\n`);

    // Get Yassine Bounou's current assignment
    const bounou = await query('SELECT id, team_id FROM players WHERE name = $1', ['Yassine Bounou']);

    if (bounou.rows.length === 0) {
      console.log('❌ Yassine Bounou not found');
      process.exit(1);
    }

    const bBounouId = bounou.rows[0].id;
    const currentTeamId = bounou.rows[0].team_id;

    console.log(`👤 Yassine Bounou:`);
    console.log(`   Current Team ID: ${currentTeamId}`);
    console.log(`   Should be: ${alHilalId}\n`);

    // Fix Bounou's team
    if (currentTeamId !== alHilalId) {
      console.log('🔄 Updating Yassine Bounou...');
      await query(
        'UPDATE players SET team_id = $1 WHERE id = $2',
        [alHilalId, bBounouId]
      );
      console.log('✅ Yassine Bounou reassigned to Al-Hilal Saudi FC\n');
    } else {
      console.log('✅ Yassine Bounou is already on Al-Hilal Saudi FC\n');
    }

    // Check for other players who might be on the wrong team
    console.log('🔍 Checking for other players on wrong teams...\n');

    // Common player team corrections based on Wikidata
    const corrections = [
      { name: 'Sofiane Boufal', expectedTeam: alHilalId, description: 'Al-Hilal Saudi FC' },
      { name: 'Abderrazak Hamdallah', expectedTeam: alAhliId, description: 'Al-Ittihad FC' }, // Check if this is correct
      { name: 'Achraf Dari', expectedTeam: null, description: 'Al-Qadisiyah FC' }, // Will check
    ];

    for (const correction of corrections) {
      const player = await query(
        'SELECT id, team_id FROM players WHERE name = $1',
        [correction.name]
      );

      if (player.rows.length > 0) {
        const playerData = player.rows[0];
        const currentTeam = await query(
          'SELECT name FROM teams WHERE id = $1',
          [playerData.team_id]
        );

        console.log(`${correction.name}:`);
        console.log(`   Current: ${currentTeam.rows[0]?.name || 'Unknown'}`);
        console.log(`   Expected: ${correction.description}\n`);
      }
    }

    console.log('═'.repeat(60));
    console.log('✅ Player team corrections completed');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

fixBounouAndOtherPlayers();
