import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

/**
 * QUICK SAMPLE VERIFICATION
 * Verifies only players with match appearances (the ones that matter most)
 */

class QuickSampleVerifier {
  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY;
    this.results = {
      verified: [],
      mismatches: [],
      notFound: []
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async verifyPlayer(player) {
    try {
      await this.delay(3000); // 3 second delay per request

      const url = `https://v3.football-api.com/players/search?name=${encodeURIComponent(player.name)}`;
      const response = await fetch(url, {
        headers: { 'x-apisports-key': this.apiKey },
        timeout: 15000
      });

      if (response.status === 429) {
        console.log(`\n⚠️  Rate limited. Waiting 120 seconds...`);
        await this.delay(120000);
        return this.verifyPlayer(player);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.response || data.response.length === 0) {
        this.results.notFound.push({
          name: player.name,
          dbTeam: player.current_team || 'NO TEAM',
          appearances: player.appearances
        });
        console.log(`❌ ${player.name} - NOT FOUND in API`);
        return;
      }

      const apiPlayer = data.response[0];
      const apiTeam = apiPlayer.statistics[0]?.team?.name;

      if (player.current_team?.toLowerCase() === apiTeam?.toLowerCase()) {
        this.results.verified.push({
          name: player.name,
          team: apiTeam,
          appearances: player.appearances
        });
        console.log(`✅ ${player.name} - Correct (${apiTeam})`);
      } else {
        this.results.mismatches.push({
          name: player.name,
          dbTeam: player.current_team || 'NO TEAM',
          apiTeam: apiTeam || 'NO TEAM',
          appearances: player.appearances
        });
        console.log(`⚠️  ${player.name} - MISMATCH! DB: ${player.current_team || 'NO TEAM'} → API: ${apiTeam || 'NO TEAM'}`);
      }

    } catch (error) {
      console.log(`🔴 ${player.name} - ERROR: ${error.message}`);
    }
  }

  async verify() {
    console.log('🔍 QUICK SAMPLE VERIFICATION\n');
    console.log('Checking players with match appearances (most critical)\n');
    console.log('═'.repeat(70) + '\n');

    try {
      // Get only players with appearances (sorted by matches played)
      const players = await query(`
        SELECT 
          p.id,
          p.name,
          p.team_id,
          t.name as current_team,
          COUNT(mp.id) as appearances
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN match_players mp ON p.id = mp.player_id
        WHERE p.nationality = 'Morocco'
        GROUP BY p.id, p.name, p.team_id, t.name
        HAVING COUNT(mp.id) > 0
        ORDER BY appearances DESC
      `);

      console.log(`📊 Found ${players.rows.length} players with match appearances\n`);
      console.log('Verifying...\n');

      for (let i = 0; i < players.rows.length; i++) {
        const player = players.rows[i];
        await this.verifyPlayer(player);
        console.log(`   (${i + 1}/${players.rows.length})\n`);
      }

      this.generateReport();

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
    }

    process.exit(0);
  }

  generateReport() {
    console.log('\n' + '═'.repeat(70));
    console.log('📋 SAMPLE VERIFICATION REPORT');
    console.log('═'.repeat(70) + '\n');

    console.log('📊 SUMMARY:\n');
    console.log(`   ✅ Correct: ${this.results.verified.length}`);
    console.log(`   ⚠️  Mismatches: ${this.results.mismatches.length}`);
    console.log(`   ❌ Not Found: ${this.results.notFound.length}\n`);

    if (this.results.mismatches.length > 0) {
      console.log('\n🔴 MISMATCHES FOUND:\n');
      this.results.mismatches.forEach((m, idx) => {
        console.log(`${idx + 1}. ${m.name} (${m.appearances} appearances)`);
        console.log(`   DB: ${m.dbTeam}`);
        console.log(`   API: ${m.apiTeam}\n`);
      });
    }

    if (this.results.notFound.length > 0) {
      console.log('\n🟡 NOT FOUND IN API:\n');
      this.results.notFound.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.name} (${p.appearances} appearances, DB: ${p.dbTeam})`);
      });
    }

    console.log('\n✅ Verified players:');
    this.results.verified.slice(0, 10).forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name} (${p.appearances} appearances)`);
    });

    const reportFile = 'quick-verification-report.json';
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportFile}`);
  }
}

const verifier = new QuickSampleVerifier();
verifier.verify();
