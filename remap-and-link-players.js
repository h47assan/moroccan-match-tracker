import { query } from './server/config/database.js';

/**
 * Remap Moroccan players from Wikidata teams to API-Football teams based on name matching
 */
async function remapMoroccanPlayersToApiTeams() {
  console.log('🔄 Starting Moroccan player remapping to API-Football teams...\n');

  try {
    // Get all API-Football teams in our matches
    const apiTeamsResult = await query(`
      SELECT DISTINCT t.id, t.name, t.api_football_id
      FROM teams t
      WHERE t.api_football_id IS NOT NULL
      AND (t.id IN (SELECT home_team_id FROM matches) OR t.id IN (SELECT away_team_id FROM matches))
      ORDER BY t.name
    `);

    console.log(`📊 Found ${apiTeamsResult.rows.length} API-Football teams in matches\n`);

    // Get all Wikidata teams that have Moroccan players
    const wikidataTeamsResult = await query(`
      SELECT DISTINCT t.id, t.name
      FROM teams t
      WHERE t.api_football_id IS NULL
      AND t.id IN (SELECT team_id FROM players WHERE nationality = 'Morocco' AND team_id IS NOT NULL)
      ORDER BY t.name
    `);

    console.log(`📚 Found ${wikidataTeamsResult.rows.length} Wikidata teams with Moroccan players\n`);

    // Normalize string for comparison
    const normalize = (str) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]/g, '') // Remove special chars
        .replace(/\s+/g, ''); // Remove spaces
    };

    let remappedCount = 0;
    const mappings = new Map();

    // Try to find matching teams
    for (const wikidataTeam of wikidataTeamsResult.rows) {
      const normalizedWikidata = normalize(wikidataTeam.name);
      let bestMatch = null;
      let bestScore = 0;

      for (const apiTeam of apiTeamsResult.rows) {
        const normalizedApi = normalize(apiTeam.name);

        // Calculate similarity score
        if (normalizedApi === normalizedWikidata) {
          bestScore = 1;
          bestMatch = apiTeam;
          break;
        }

        if (normalizedApi.includes(normalizedWikidata) || normalizedWikidata.includes(normalizedApi)) {
          bestScore = 0.9;
          bestMatch = apiTeam;
        }

        // Check for partial matches
        let matches = 0;
        for (const char of normalizedWikidata) {
          if (normalizedApi.includes(char)) matches++;
        }
        const score = matches / normalizedWikidata.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = apiTeam;
        }
      }

      if (bestMatch && bestScore >= 0.7) {
        console.log(`✅ Matched: ${wikidataTeam.name} → ${bestMatch.name} (score: ${bestScore.toFixed(2)})`);

        // Get count of Moroccan players for this team
        const playersResult = await query(
          `SELECT COUNT(*) as count FROM players WHERE team_id = $1 AND nationality = 'Morocco'`,
          [wikidataTeam.id]
        );

        const playerCount = playersResult.rows[0].count;

        // Update all Moroccan players from this Wikidata team to the API-Football team
        await query(
          `UPDATE players SET team_id = $1 WHERE team_id = $2 AND nationality = 'Morocco'`,
          [bestMatch.id, wikidataTeam.id]
        );

        remappedCount += playerCount;
        mappings.set(wikidataTeam.id, bestMatch.id);
        console.log(`   Remapped ${playerCount} players`);
      }
    }

    console.log('\n✅ Player remapping completed!');
    console.log(`👥 Total players remapped: ${remappedCount}`);

    return { remappedCount, mappings };
  } catch (error) {
    console.error('❌ Error remapping players:', error.message);
    throw error;
  }
}

// Run the remapping
remapMoroccanPlayersToApiTeams()
  .then(result => {
    console.log('\n✨ Now linking players to matches...');
    
    // After remapping, link players to matches
    return linkPlayersToMatches();
  })
  .then(linkResult => {
    console.log('\n✨ Done! All Moroccan players are now linked to their matches');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

/**
 * Link Moroccan players to matches based on team membership
 */
async function linkPlayersToMatches() {
  console.log('🔗 Linking Moroccan players to matches...\n');

  try {
    // Get all matches
    const matchesResult = await query(`
      SELECT m.id, m.home_team_id, m.away_team_id
      FROM matches m
      ORDER BY m.kickoff_time DESC
      LIMIT 500
    `);

    console.log(`📊 Processing ${matchesResult.rows.length} matches\n`);

    let linkedCount = 0;
    let matchesWithPlayers = 0;

    for (const match of matchesResult.rows) {
      // Get Moroccan players from both teams
      const playersResult = await query(`
        SELECT DISTINCT p.id
        FROM players p
        WHERE p.nationality = 'Morocco'
        AND (p.team_id = $1 OR p.team_id = $2)
      `, [match.home_team_id, match.away_team_id]);

      const players = playersResult.rows;

      if (players.length > 0) {
        matchesWithPlayers++;

        // Link all players to this match
        for (const player of players) {
          await query(
            `INSERT INTO match_players (match_id, player_id)
             VALUES ($1, $2)
             ON CONFLICT (match_id, player_id) DO NOTHING`,
            [match.id, player.id]
          );
          linkedCount++;
        }

        console.log(`✅ Match ${match.id}: linked ${players.length} players`);
      }
    }

    console.log('\n✅ Player-match linking completed!');
    console.log(`👥 Total player-match associations: ${linkedCount}`);
    console.log(`🎯 Matches with Moroccan players: ${matchesWithPlayers}`);

    return { linkedCount, matchesWithPlayers };
  } catch (error) {
    console.error('❌ Error linking players to matches:', error.message);
    throw error;
  }
}
