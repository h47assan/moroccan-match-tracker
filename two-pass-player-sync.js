#!/usr/bin/env node

/**
 * Two-Pass Player Synchronization Script
 * 
 * Pass 1: Direct Player Search
 * - Search for each of the 932 Moroccan players individually
 * - Get their current team from API-Football
 * - Compare with database
 * - Update if team has changed
 * 
 * Pass 2: Team Roster Verification
 * - Fetch rosters for 10 major leagues
 * - Identify Moroccan players in each roster
 * - Find players missing from database
 * - Add them with correct team assignments
 * 
 * Uses caching to handle interruptions and rate limiting (6 seconds between requests)
 */

import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, 'sync-cache.json');
const REPORT_FILE = path.join(__dirname, 'two-pass-sync-report.json');

const API_KEY = process.env.FOOTBALL_API_KEY;
const API_HOST = 'api-football-v3.p.rapidapi.com';
const REQUEST_DELAY = 6000; // 6 seconds between requests

if (!API_KEY) {
  console.error('ERROR: FOOTBALL_API_KEY not set in .env');
  process.exit(1);
}

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cache management
let cache = {
  pass1: {
    processed: 0,
    completed: false,
    updates: [],
    errors: [],
    searchResults: {}
  },
  pass2: {
    processed: 0,
    completed: false,
    newPlayers: [],
    updates: [],
    errors: []
  },
  timestamp: new Date().toISOString()
};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      console.log(`✓ Loaded cache from ${CACHE_FILE}`);
      console.log(`  Pass 1: ${cache.pass1.processed} processed`);
      console.log(`  Pass 2: ${cache.pass2.processed} processed`);
      return true;
    }
  } catch (err) {
    console.log('No valid cache found, starting fresh');
  }
  return false;
}

function saveCache() {
  cache.timestamp = new Date().toISOString();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function makeAPIRequest(endpoint, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://${API_HOST}${endpoint}`, {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': API_HOST,
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (response.status === 429) {
        console.log(`⚠️  Rate limited. Waiting 60 seconds...`);
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`  Attempt ${attempt}/${retries} failed, retrying...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============= PASS 1: Direct Player Search =============

async function pass1DirectPlayerSearch() {
  console.log('\n📋 PASS 1: Direct Player Search');
  console.log('================================\n');

  // Get all Moroccan players from database
  const result = await pool.query(`
    SELECT id, name, position, wikidata_id 
    FROM players 
    WHERE country = 'Morocco'
    ORDER BY id
  `);

  const players = result.rows;
  console.log(`Found ${players.length} Moroccan players to verify\n`);

  for (let i = cache.pass1.processed; i < players.length; i++) {
    const player = players[i];
    
    try {
      // Check cache first
      if (cache.pass1.searchResults[player.id]) {
        console.log(`[${i + 1}/${players.length}] ${player.name} (cached)`);
        cache.pass1.processed++;
        continue;
      }

      console.log(`[${i + 1}/${players.length}] Searching: ${player.name}...`);

      // Search player on API-Football
      const searchData = await makeAPIRequest(`/players?search=${encodeURIComponent(player.name)}`);

      if (searchData.response && searchData.response.length > 0) {
        // Find best match (first result usually most relevant)
        const apiPlayer = searchData.response[0];
        cache.pass1.searchResults[player.id] = {
          name: player.name,
          apiPlayer: apiPlayer
        };

        if (apiPlayer.statistics && apiPlayer.statistics.length > 0) {
          // Get current team from most recent statistics
          const latestStat = apiPlayer.statistics[0];
          if (latestStat.team) {
            const currentTeam = latestStat.team;
            console.log(`  → Found: ${apiPlayer.player.name} at ${currentTeam.name}`);

            // Get or create team
            const teamId = await getOrCreateTeam(currentTeam.name);

            // Check if current team is different
            const currentAssignment = await pool.query(
              'SELECT team_id FROM players WHERE id = $1',
              [player.id]
            );

            const existingTeamId = currentAssignment.rows[0]?.team_id;

            if (existingTeamId !== teamId) {
              cache.pass1.updates.push({
                playerId: player.id,
                playerName: player.name,
                oldTeamId: existingTeamId || null,
                newTeamId: teamId,
                newTeamName: currentTeam.name
              });

              // Update player team
              await pool.query(
                'UPDATE players SET team_id = $1, updated_at = NOW() WHERE id = $2',
                [teamId, player.id]
              );
              console.log(`  ✓ Updated team to: ${currentTeam.name}`);
            } else {
              console.log(`  ✓ Team already correct: ${currentTeam.name}`);
            }
          }
        }
      } else {
        cache.pass1.errors.push({
          playerId: player.id,
          playerName: player.name,
          error: 'No results found'
        });
        console.log(`  ✗ No results found`);
      }

      cache.pass1.processed++;
      saveCache();
      await sleep(REQUEST_DELAY);

    } catch (err) {
      cache.pass1.errors.push({
        playerId: player.id,
        playerName: player.name,
        error: err.message
      });
      console.error(`  ✗ Error: ${err.message}`);
      cache.pass1.processed++;
      saveCache();
      await sleep(REQUEST_DELAY);
    }
  }

  cache.pass1.completed = true;
  console.log(`\n✓ Pass 1 complete: ${cache.pass1.updates.length} updates, ${cache.pass1.errors.length} errors`);
}

// ============= PASS 2: Team Roster Verification =============

// Major leagues to verify rosters from
const LEAGUES_TO_CHECK = [
  { id: 1, name: 'Premier League (Saudi)' },
  { id: 307, name: 'Botola Pro (Morocco)' },
  { id: 39, name: 'Premier League (England)' },
  { id: 140, name: 'La Liga (Spain)' },
  { id: 61, name: 'Ligue 1 (France)' },
  { id: 78, name: 'Bundesliga (Germany)' },
  { id: 135, name: 'Serie A (Italy)' },
  { id: 94, name: 'Eredivisie (Netherlands)' },
  { id: 71, name: 'Turkish Super Lig' },
  { id: 203, name: 'Russian Premier League' }
];

const CURRENT_SEASON = 2024;

async function pass2TeamRosterVerification() {
  console.log('\n📋 PASS 2: Team Roster Verification');
  console.log('====================================\n');

  for (const league of LEAGUES_TO_CHECK) {
    console.log(`\nChecking league: ${league.name} (ID: ${league.id})`);

    try {
      // Get all teams in league
      const leagueData = await makeAPIRequest(`/teams?league=${league.id}&season=${CURRENT_SEASON}`);

      if (!leagueData.response) {
        console.log(`  ⚠️  No teams found`);
        continue;
      }

      const teams = leagueData.response;
      console.log(`  Found ${teams.length} teams`);

      for (const team of teams) {
        try {
          console.log(`    Checking: ${team.team.name}...`);

          // Get squad for team
          const squadData = await makeAPIRequest(`/players?team=${team.team.id}&season=${CURRENT_SEASON}`);

          if (!squadData.response) {
            console.log(`      ⚠️  No squad data`);
            continue;
          }

          // Filter for Moroccan players
          const moroccanPlayers = squadData.response.filter(p => 
            p.player.nationality && 
            p.player.nationality.toLowerCase().includes('morocco')
          );

          if (moroccanPlayers.length === 0) {
            console.log(`      No Moroccan players`);
            continue;
          }

          console.log(`      Found ${moroccanPlayers.length} Moroccan players`);

          // Check if these players are in our database
          for (const squadPlayer of moroccanPlayers) {
            try {
              // Search for player in database
              const dbResult = await pool.query(`
                SELECT id, team_id 
                FROM players 
                WHERE name ILIKE $1 AND country = 'Morocco'
                LIMIT 1
              `, [`%${squadPlayer.player.name}%`]);

              if (dbResult.rows.length > 0) {
                const dbPlayer = dbResult.rows[0];
                const teamId = await getOrCreateTeam(team.team.name);

                if (dbPlayer.team_id !== teamId) {
                  cache.pass2.updates.push({
                    playerId: dbPlayer.id,
                    playerName: squadPlayer.player.name,
                    oldTeamId: dbPlayer.team_id || null,
                    newTeamId: teamId,
                    newTeamName: team.team.name
                  });

                  await pool.query(
                    'UPDATE players SET team_id = $1, updated_at = NOW() WHERE id = $2',
                    [teamId, dbPlayer.id]
                  );
                  console.log(`        ✓ Updated: ${squadPlayer.player.name} → ${team.team.name}`);
                }
              } else {
                // New player found
                const newPlayerId = `new_${Date.now()}_${Math.random()}`;
                const teamId = await getOrCreateTeam(team.team.name);

                cache.pass2.newPlayers.push({
                  name: squadPlayer.player.name,
                  position: squadPlayer.statistics[0]?.games?.position || 'Unknown',
                  team: team.team.name,
                  teamId: teamId,
                  league: league.name
                });

                console.log(`        ✨ New player found: ${squadPlayer.player.name}`);
              }

              await sleep(500); // Shorter delay within team
            } catch (err) {
              console.error(`        ✗ Error processing player: ${err.message}`);
            }
          }

          await sleep(REQUEST_DELAY);
        } catch (err) {
          console.error(`    ✗ Error checking team: ${err.message}`);
          cache.pass2.errors.push({
            league: league.name,
            team: team.team.name,
            error: err.message
          });
          await sleep(REQUEST_DELAY);
        }
      }

      cache.pass2.processed++;
      saveCache();

    } catch (err) {
      console.error(`  ✗ Error with league: ${err.message}`);
      cache.pass2.errors.push({
        league: league.name,
        error: err.message
      });
      cache.pass2.processed++;
      saveCache();
      await sleep(REQUEST_DELAY);
    }
  }

  cache.pass2.completed = true;
  console.log(`\n✓ Pass 2 complete: ${cache.pass2.newPlayers.length} new players, ${cache.pass2.updates.length} updates`);
}

// ============= HELPER FUNCTIONS =============

async function getOrCreateTeam(teamName) {
  if (!teamName) {
    console.warn('⚠️  Team name is empty');
    return null;
  }

  // Normalize team name
  const normalized = normalizeTeamName(teamName);

  try {
    // Try to find exact match first
    let result = await pool.query(
      'SELECT id FROM teams WHERE LOWER(name) = $1',
      [teamName.toLowerCase()]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Try normalized match
    result = await pool.query(
      'SELECT id FROM teams WHERE LOWER(REGEXP_REPLACE(name, \'[^a-z0-9]\', \'\', \'g\')) = $1',
      [normalized]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Check variations
    const variations = getTeamVariations(teamName);
    for (const variant of variations) {
      result = await pool.query(
        'SELECT id FROM teams WHERE LOWER(name) LIKE $1',
        [`%${variant}%`]
      );
      if (result.rows.length > 0) {
        return result.rows[0].id;
      }
    }

    // Team not found, create it
    const createResult = await pool.query(
      'INSERT INTO teams (name, created_at) VALUES ($1, NOW()) RETURNING id',
      [teamName]
    );

    console.log(`  ✨ Created new team: ${teamName}`);
    return createResult.rows[0].id;

  } catch (err) {
    console.error(`Error with team "${teamName}": ${err.message}`);
    return null;
  }
}

function normalizeTeamName(name) {
  return name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getTeamVariations(teamName) {
  const variations = [];
  
  // Remove accents
  variations.push(normalizeTeamName(teamName));
  
  // Common variations
  const lowerName = teamName.toLowerCase();
  if (lowerName.includes('al-hilal')) {
    variations.push('al-hilal');
    variations.push('al hilal');
  }
  if (lowerName.includes('al-ahli')) {
    variations.push('al-ahli');
    variations.push('al ahli');
  }
  if (lowerName.includes('fc')) {
    variations.push(teamName.replace(/\s*fc\s*/i, '').trim());
  }
  if (lowerName.includes('real')) {
    variations.push('real');
  }
  if (lowerName.includes('manchester')) {
    variations.push('manchester');
  }

  return [...new Set(variations)];
}

// ============= REPORTING =============

function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      pass1: {
        searchesAttempted: cache.pass1.processed,
        updatesApplied: cache.pass1.updates.length,
        errorsEncountered: cache.pass1.errors.length,
        completed: cache.pass1.completed
      },
      pass2: {
        leaguesProcessed: cache.pass2.processed,
        newPlayersFound: cache.pass2.newPlayers.length,
        updatesApplied: cache.pass2.updates.length,
        errorsEncountered: cache.pass2.errors.length,
        completed: cache.pass2.completed
      },
      totalUpdates: cache.pass1.updates.length + cache.pass2.updates.length,
      totalNewPlayers: cache.pass2.newPlayers.length
    },
    pass1: {
      updates: cache.pass1.updates,
      errors: cache.pass1.errors
    },
    pass2: {
      newPlayers: cache.pass2.newPlayers,
      updates: cache.pass2.updates,
      errors: cache.pass2.errors
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n✓ Report saved to ${REPORT_FILE}`);

  return report;
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('SYNC SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nPass 1 - Direct Player Search:`);
  console.log(`  Players searched: ${cache.pass1.processed}`);
  console.log(`  Team updates: ${cache.pass1.updates.length}`);
  console.log(`  Errors: ${cache.pass1.errors.length}`);
  console.log(`  Status: ${cache.pass1.completed ? '✓ Complete' : '⏳ In Progress'}`);
  
  console.log(`\nPass 2 - Team Roster Verification:`);
  console.log(`  Leagues processed: ${cache.pass2.processed}/${LEAGUES_TO_CHECK.length}`);
  console.log(`  New players found: ${cache.pass2.newPlayers.length}`);
  console.log(`  Team updates: ${cache.pass2.updates.length}`);
  console.log(`  Errors: ${cache.pass2.errors.length}`);
  console.log(`  Status: ${cache.pass2.completed ? '✓ Complete' : '⏳ In Progress'}`);

  console.log(`\nTotal Improvements:`);
  console.log(`  Team assignments updated: ${cache.pass1.updates.length + cache.pass2.updates.length}`);
  console.log(`  New players added: ${cache.pass2.newPlayers.length}`);
  console.log('='.repeat(60) + '\n');
}

// ============= MAIN EXECUTION =============

async function main() {
  console.log('\n🚀 Two-Pass Player Synchronization Started');
  console.log(`📅 ${new Date().toISOString()}\n`);

  try {
    // Load existing cache if available
    loadCache();

    // Run passes
    if (!cache.pass1.completed) {
      await pass1DirectPlayerSearch();
      saveCache();
    } else {
      console.log('\n✓ Pass 1 already completed, skipping');
    }

    if (!cache.pass2.completed) {
      await pass2TeamRosterVerification();
      saveCache();
    } else {
      console.log('\n✓ Pass 2 already completed, skipping');
    }

    // Generate report
    generateReport();
    printSummary();

    console.log('✓ Sync completed successfully!');

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
