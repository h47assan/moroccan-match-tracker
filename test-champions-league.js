import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

async function testChampionsLeague() {
  console.log('🏆 Testing Champions League data fetch...\n');
  
  try {
    const url = new URL(`${API_FOOTBALL_BASE_URL}/fixtures`);
    url.searchParams.append('league', '2');  // Champions League ID
    url.searchParams.append('season', '2024');
    url.searchParams.append('from', '2025-01-20');
    url.searchParams.append('to', '2025-01-31');
    
    console.log('📋 REQUEST:');
    console.log('Endpoint: /fixtures');
    console.log('Parameters:');
    console.log('  - league: 2 (UEFA Champions League)');
    console.log('  - season: 2024');
    console.log('  - from: 2025-01-20');
    console.log('  - to: 2025-01-31');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    const data = await response.json();
    
    console.log('\n✅ RESPONSE:');
    console.log('Results found:', data.results);
    console.log('Errors:', JSON.stringify(data.errors));
    
    if (data.response && data.response.length > 0) {
      console.log('\n📦 Champions League fixtures found:');
      data.response.forEach((fixture, index) => {
        console.log(`\n${index + 1}. ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`   Date: ${new Date(fixture.fixture.date).toLocaleString()}`);
        console.log(`   Venue: ${fixture.fixture.venue?.name || 'TBD'}`);
        console.log(`   Status: ${fixture.fixture.status.long}`);
        console.log(`   Score: ${fixture.goals.home ?? '-'} - ${fixture.goals.away ?? '-'}`);
      });
    } else {
      console.log('\n⚠️  No Champions League fixtures found in this date range.');
      console.log('This might be because:');
      console.log('  - Champions League is between match days');
      console.log('  - The knockout stage hasn\'t started yet');
      console.log('  - Try a different date range');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

testChampionsLeague();
