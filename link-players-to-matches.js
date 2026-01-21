import { query } from './server/config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, './server/.env') });

/**
 * Link Moroccan players to matches based on team rosters
 */
async function linkPlayersToMatches() {
  console.log('🔄 Starting player-match linking...\n');

  try {
    // Get all matches
    const matchesResult = await query(`
      SELECT m.id, m.home_team_id, m.away_team_id, m.kickoff_time
      FROM matches m
      ORDER BY m.kickoff_time DESC
      LIMIT 200
    `);

    console.log(`📊 Found ${matchesResult.rows.length} matches to process\n`);

    let linkedCount = 0;
    const linkedMatches = new Set();

    for (const match of matchesResult.rows) {
      // Get Moroccan players from home team
      const homePlayersResult = await query(
        `SELECT id FROM players WHERE team_id = $1 AND nationality = 'Morocco'`,
        [match.home_team_id]
      );

      // Get Moroccan players from away team
      const awayPlayersResult = await query(
        `SELECT id FROM players WHERE team_id = $1 AND nationality = 'Morocco'`,
        [match.away_team_id]
      );

      const moroccanPlayers = [
        ...homePlayersResult.rows,
        ...awayPlayersResult.rows
      ];

      if (moroccanPlayers.length > 0) {
        // Check how many are already linked
        const alreadyLinkedResult = await query(
          `SELECT COUNT(*) as count FROM match_players WHERE match_id = $1`,
          [match.id]
        );

        const alreadyLinked = parseInt(alreadyLinkedResult.rows[0].count);

        // Link all Moroccan players to this match
        for (const player of moroccanPlayers) {
          await query(
            `INSERT INTO match_players (match_id, player_id)
             VALUES ($1, $2)
             ON CONFLICT (match_id, player_id) DO NOTHING`,
            [match.id, player.id]
          );
          linkedCount++;
        }

        if (alreadyLinked === 0 && moroccanPlayers.length > 0) {
          linkedMatches.add(match.id);
          console.log(`✅ Linked ${moroccanPlayers.length} Moroccan players to match ${match.id}`);
        }
      }
    }

    console.log('\n✅ Player-match linking completed!');
    console.log(`📈 Total player-match associations: ${linkedCount}`);
    console.log(`🎯 Matches with Moroccan players: ${linkedMatches.size}`);

    return { linkedCount, matchesWithPlayers: linkedMatches.size };
  } catch (error) {
    console.error('❌ Error linking players to matches:', error.message);
    throw error;
  }
}

// Run the linking
linkPlayersToMatches()
  .then(result => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
