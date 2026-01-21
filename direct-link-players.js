import { query } from './server/config/database.js';

/**
 * Link all Moroccan players to matches by traversing team relationships
 */
async function linkPlayersToMatchesDirect() {
  console.log('🔗 Linking Moroccan players to matches (direct approach)...\n');

  try {
    // Find all matches and check if their teams have Moroccan players
    const matchesResult = await query(`
      SELECT m.id, m.home_team_id, m.away_team_id
      FROM matches m
      ORDER BY m.kickoff_time DESC
      LIMIT 1000
    `);

    console.log(`📊 Processing ${matchesResult.rows.length} matches\n`);

    let totalLinked = 0;
    let matchesWithPlayers = 0;

    for (const match of matchesResult.rows) {
      // Get Moroccan players on the home team
      const homePlayersResult = await query(
        `SELECT id FROM players WHERE team_id = $1 AND nationality = 'Morocco'`,
        [match.home_team_id]
      );

      // Get Moroccan players on the away team
      const awayPlayersResult = await query(
        `SELECT id FROM players WHERE team_id = $1 AND nationality = 'Morocco'`,
        [match.away_team_id]
      );

      const allPlayers = [...homePlayersResult.rows, ...awayPlayersResult.rows];

      if (allPlayers.length > 0) {
        matchesWithPlayers++;

        // Link each player to the match
        for (const player of allPlayers) {
          await query(
            `INSERT INTO match_players (match_id, player_id)
             VALUES ($1, $2)
             ON CONFLICT (match_id, player_id) DO NOTHING`,
            [match.id, player.id]
          );
          totalLinked++;
        }

        if (matchesWithPlayers <= 20) { // Log first 20
          console.log(`✅ Match ${match.id}: linked ${allPlayers.length} players`);
        }
      }
    }

    console.log(`\n...processed remaining matches...\n`);
    console.log('✅ Player-match linking completed!');
    console.log(`👥 Total player-match associations: ${totalLinked}`);
    console.log(`🎯 Matches with Moroccan players: ${matchesWithPlayers}`);

    return { totalLinked, matchesWithPlayers };
  } catch (error) {
    console.error('❌ Error linking players to matches:', error.message);
    throw error;
  }
}

// Run the linking
linkPlayersToMatchesDirect()
  .then(result => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
