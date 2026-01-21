import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

async function testApiFootball() {
  console.log('🔍 Testing API-Football data structure...\n');
  
  try {
    // Test 1: Get one fixture from Premier League
    console.log('📋 REQUEST #1: Get fixtures from Premier League with date range');
    console.log('Endpoint: /fixtures');
    console.log('Parameters: { league: 39, season: 2024, from: "2025-01-20", to: "2025-01-21" }');
    
    const url = new URL(`${API_FOOTBALL_BASE_URL}/fixtures`);
    url.searchParams.append('league', '39');
    url.searchParams.append('season', '2024');
    url.searchParams.append('from', '2025-01-20');
    url.searchParams.append('to', '2025-01-21');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    const data = await response.json();
    
    console.log('\n✅ RESPONSE STRUCTURE:');
    console.log('├─ errors:', JSON.stringify(data.errors));
    console.log('├─ results:', data.results);
    console.log('├─ paging:', JSON.stringify(data.paging));
    console.log('└─ response: array of', data.response?.length, 'fixtures');
    
    if (data.response && data.response.length > 0) {
      const fixture = data.response[0];
      console.log('\n📦 FIXTURE DATA STRUCTURE:');
      console.log('fixture:', {
        id: fixture.fixture.id,
        date: fixture.fixture.date,
        timestamp: fixture.fixture.timestamp,
        venue: fixture.fixture.venue?.name,
        status: fixture.fixture.status.short + ' - ' + fixture.fixture.status.long
      });
      console.log('\nleague:', {
        id: fixture.league.id,
        name: fixture.league.name,
        country: fixture.league.country,
        logo: fixture.league.logo,
        season: fixture.league.season
      });
      console.log('\nteams:');
      console.log('  home:', {
        id: fixture.teams.home.id,
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo
      });
      console.log('  away:', {
        id: fixture.teams.away.id,
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo
      });
      console.log('\ngoals:', {
        home: fixture.goals.home,
        away: fixture.goals.away
      });
      console.log('\nscore:', {
        halftime: fixture.score.halftime,
        fulltime: fixture.score.fulltime,
        extratime: fixture.score.extratime,
        penalty: fixture.score.penalty
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 WHAT WE ARE CALLING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Endpoint: /fixtures');
    console.log('Method: GET');
    console.log('Headers: x-rapidapi-key, x-rapidapi-host');
    console.log('\n📥 WHAT WE ARE ASKING FOR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• league ID (e.g., 39 = Premier League)');
    console.log('• season (2024 = 2024/2025 season)');
    console.log('• date range (from/to dates)');
    console.log('• timezone (UTC)');
    console.log('\n📤 WHAT WE ARE RECEIVING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Match ID, date, time, venue');
    console.log('• League info (name, country, logo)');
    console.log('• Home team (ID, name, logo)');
    console.log('• Away team (ID, name, logo)');
    console.log('• Score (home, away)');
    console.log('• Status (scheduled, live, finished, etc.)');
    console.log('\n❌ WHAT WE ARE NOT GETTING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Player lineups (would need /fixtures/lineups endpoint)');
    console.log('• Individual player data (would need /players endpoint)');
    console.log('• Player statistics (would need /fixtures/players endpoint)');
    console.log('• Squad rosters (would need /players/squads endpoint)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

testApiFootball();
