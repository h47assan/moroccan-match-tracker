import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function testApiFootball() {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  
  console.log('🔍 Testing API-Football connection...\n');
  console.log(`API Key: ${API_KEY?.substring(0, 10)}...${API_KEY?.substring(API_KEY.length - 5)}\n`);

  try {
    // Test 1: Get account status
    console.log('📊 Test 1: Checking API status...');
    const statusResponse = await fetch('https://v3.football.api-sports.io/status', {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });

    const statusData = await statusResponse.json();
    console.log('Status:', JSON.stringify(statusData, null, 2));
    console.log();

    // Test 2: Search for a well-known team
    console.log('⚽ Test 2: Searching for "Manchester United"...');
    const teamResponse = await fetch('https://v3.football.api-sports.io/teams?search=Manchester United', {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });

    const teamData = await teamResponse.json();
    console.log('Results:', JSON.stringify(teamData, null, 2));
    console.log();

    // Test 3: Get fixtures for today
    console.log('📅 Test 3: Getting today\'s fixtures...');
    const today = new Date().toISOString().split('T')[0];
    const fixturesResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });

    const fixturesData = await fixturesResponse.json();
    console.log(`Found ${fixturesData.response?.length || 0} fixtures for today`);
    if (fixturesData.response && fixturesData.response.length > 0) {
      console.log('Sample fixture:', JSON.stringify(fixturesData.response[0], null, 2).substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApiFootball();
