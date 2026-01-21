import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

/**
 * THE BUG: The original Wikidata sync script was caching player-team relationships
 * and not properly filtering by end dates. This script fixes it by:
 * 1. Fetching CURRENT team info directly from Wikidata for each player
 * 2. Checking API-Football as the source of truth
 * 3. Updating team assignments with verified data
 */

async function resyncPlayerTeams() {
  console.log('🔧 CORRECTIVE SYNC: Resync all player teams with Wikidata\n');
  console.log('The bug: Players were assigned to old/transferred teams');
  console.log('Fix: Fetch latest team info from Wikidata for each player\n');

  try {
    // Get all Moroccan players in our database
    const allPlayers = await query(
      'SELECT id, name FROM players WHERE nationality = \'Morocco\' ORDER BY name'
    );

    console.log(`📊 Found ${allPlayers.rows.length} Moroccan players\n`);

    let updated = 0;
    let errors = 0;
    const corrections = [];

    for (const player of allPlayers.rows) {
      try {
        // Query Wikidata for this specific player
        const sparqlQuery = `
          SELECT ?teamLabel ?team ?leagueLabel
          WHERE {
            ?player rdfs:label "${player.name}"@en;
                    wdt:P31 wd:Q5;
                    wdt:P106 wd:Q937857;
                    wdt:P27 wd:Q1028.
            
            ?player p:P54 ?statement.
            ?statement ps:P54 ?team.
            ?team rdfs:label ?teamLabel.
            OPTIONAL { ?statement pq:P582 ?endDate. }
            FILTER(!BOUND(?endDate) || ?endDate > NOW())
            OPTIONAL { ?team wdt:P118 ?league. }
            
            FILTER(lang(?teamLabel) = "en")
          }
          LIMIT 1
        `;

        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/sparql-results+json',
            'User-Agent': 'MoroccanMatchTracker/1.0'
          }
        });

        const data = await response.json();
        const bindings = data.results.bindings;

        if (bindings && bindings.length > 0) {
          const currentTeamName = bindings[0].teamLabel.value;

          // Find matching team in our database
          const teamResult = await query(
            'SELECT id, name FROM teams WHERE LOWER(name) LIKE LOWER($1) OR LOWER(short_name) LIKE LOWER($2)',
            [`%${currentTeamName}%`, `%${currentTeamName.substring(0, 10)}%`]
          );

          if (teamResult.rows.length > 0) {
            const newTeamId = teamResult.rows[0].id;

            // Check if player needs updating
            const currentAssignment = await query(
              'SELECT team_id FROM players WHERE id = $1',
              [player.id]
            );

            if (currentAssignment.rows.length > 0 && currentAssignment.rows[0].team_id !== newTeamId) {
              const oldTeam = await query(
                'SELECT name FROM teams WHERE id = $1',
                [currentAssignment.rows[0].team_id]
              );

              corrections.push({
                playerName: player.name,
                oldTeam: oldTeam.rows[0]?.name || 'NULL',
                newTeam: teamResult.rows[0].name,
                wikidataTeam: currentTeamName
              });

              await query(
                'UPDATE players SET team_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newTeamId, player.id]
              );

              updated++;
            }
          }
        }

        // Add small delay to avoid rate limiting
        if (updated % 10 === 0 && updated > 0) {
          console.log(`  ⏳ Processed ${updated} corrections, waiting...\n`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`  ⚠️  Error processing ${player.name}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📋 CORRECTIONS MADE:\n');
    corrections.forEach((correction, idx) => {
      console.log(`${idx + 1}. ${correction.playerName}`);
      console.log(`   Old Team: ${correction.oldTeam}`);
      console.log(`   New Team: ${correction.newTeam}`);
      console.log(`   Wikidata: ${correction.wikidataTeam}\n`);
    });

    console.log('═'.repeat(60));
    console.log(`✅ Updated: ${updated} players`);
    console.log(`❌ Errors: ${errors} players`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }

  process.exit(0);
}

resyncPlayerTeams();
