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
 * ROBUST PLAYER VERIFICATION SCRIPT
 * Handles API failures gracefully with caching and checkpoints
 */

class RobustPlayerVerifier {
  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY;
    this.cacheFile = 'player-verification-cache.json';
    this.resultsFile = 'player-verification-report.json';
    this.cache = this.loadCache();
    this.results = {
      total: 0,
      checked: 0,
      mismatches: [],
      notFound: [],
      unassigned: [],
      correct: [],
      apiErrors: [],
      skipped: 0
    };
  }

  loadCache() {
    if (fs.existsSync(this.cacheFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
      } catch {
        return {};
      }
    }
    return {};
  }

  saveCache() {
    fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeApiRequest(url) {
    // Check cache first
    if (this.cache[url]) {
      return this.cache[url];
    }

    try {
      // Rate limiting
      await this.delay(6000);

      const response = await fetch(url, {
        headers: { 'x-apisports-key': this.apiKey },
        timeout: 10000
      });

      if (response.status === 429) {
        throw new Error('Rate limited');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.cache[url] = data;
      this.saveCache();
      return data;

    } catch (error) {
      throw error;
    }
  }

  async verifyPlayer(player) {
    try {
      const url = `https://v3.football-api.com/players/search?name=${encodeURIComponent(player.name)}`;

      let apiData;
      try {
        apiData = await this.makeApiRequest(url);
      } catch (apiError) {
        this.results.apiErrors.push({
          name: player.name,
          error: apiError.message
        });
        return null;
      }

      if (!apiData.response || apiData.response.length === 0) {
        this.results.notFound.push({
          name: player.name,
          dbTeam: player.current_team || 'NO TEAM'
        });
        return null;
      }

      const apiPlayer = apiData.response[0];
      const apiTeam = apiPlayer.statistics[0]?.team?.name;

      const verification = {
        name: player.name,
        dbTeam: player.current_team || 'NO TEAM',
        apiTeam: apiTeam || 'NO TEAM',
        match: false,
        appearances: player.appearances
      };

      // Check if unassigned in DB but found in API
      if (!player.team_id && apiTeam) {
        this.results.unassigned.push({
          ...verification,
          suggestion: `Assign to ${apiTeam}`
        });
        return verification;
      }

      // Check if teams match
      if (player.current_team?.toLowerCase() === apiTeam?.toLowerCase()) {
        verification.match = true;
        this.results.correct.push(player.name);
      } else {
        this.results.mismatches.push(verification);
      }

      return verification;

    } catch (error) {
      this.results.apiErrors.push({
        name: player.name,
        error: error.message
      });
      return null;
    }
  }

  async verify() {
    console.log('🔍 COMPREHENSIVE MOROCCAN PLAYER VERIFICATION\n');
    console.log('═'.repeat(70) + '\n');

    try {
      // Get all players
      const allPlayers = await query(`
        SELECT 
          p.id,
          p.name,
          p.position,
          p.team_id,
          t.name as current_team,
          COUNT(mp.id) as appearances
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN match_players mp ON p.id = mp.player_id
        WHERE p.nationality = 'Morocco'
        GROUP BY p.id, p.name, p.position, p.team_id, t.name
        ORDER BY appearances DESC, p.name ASC
      `);

      console.log(`📊 Found ${allPlayers.rows.length} Moroccan players\n`);
      this.results.total = allPlayers.rows.length;

      // Verify each player
      const startTime = Date.now();
      let lastSaveTime = startTime;

      for (let i = 0; i < allPlayers.rows.length; i++) {
        const player = allPlayers.rows[i];

        // Progress update every 50 players
        if (i % 50 === 0) {
          const elapsedMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
          console.log(`⏳ Progress: ${i}/${allPlayers.rows.length} (${Math.round(i/allPlayers.rows.length*100)}%) [${elapsedMin}m elapsed]`);
        }

        await this.verifyPlayer(player);
        this.results.checked++;

        // Save results every 100 players
        if (i % 100 === 0 && i > 0) {
          this.saveResults();
          console.log(`   📁 Checkpoint: Results saved`);
        }
      }

      this.saveResults();
      this.generateReport();

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
    }

    process.exit(0);
  }

  saveResults() {
    fs.writeFileSync(this.resultsFile, JSON.stringify(this.results, null, 2));
  }

  generateReport() {
    console.log('\n\n' + '═'.repeat(70));
    console.log('📋 VERIFICATION COMPLETE');
    console.log('═'.repeat(70) + '\n');

    console.log('📊 SUMMARY:\n');
    console.log(`   Total Players: ${this.results.total}`);
    console.log(`   ✅ Correct Teams: ${this.results.correct.length}`);
    console.log(`   ❌ Team Mismatches: ${this.results.mismatches.length}`);
    console.log(`   🔲 Unassigned (API shows team): ${this.results.unassigned.length}`);
    console.log(`   ⚠️  Not Found in API: ${this.results.notFound.length}`);
    console.log(`   🔴 API Errors: ${this.results.apiErrors.length}\n`);

    // Show top mismatches
    if (this.results.mismatches.length > 0) {
      console.log('\n🔴 TOP TEAM MISMATCHES:\n');
      const topMismatches = this.results.mismatches
        .sort((a, b) => (b.appearances || 0) - (a.appearances || 0))
        .slice(0, 20);

      topMismatches.forEach((m, idx) => {
        console.log(`${idx + 1}. ${m.name}`);
        console.log(`   DB: ${m.dbTeam} → API: ${m.apiTeam} (${m.appearances || 0} appearances)`);
      });

      if (this.results.mismatches.length > 20) {
        console.log(`\n   ... and ${this.results.mismatches.length - 20} more mismatches\n`);
      }
    }

    // Show unassigned that API can help with
    if (this.results.unassigned.length > 0) {
      console.log('\n🟡 PLAYERS WITH NO TEAM (but API knows team):\n');
      const topUnassigned = this.results.unassigned
        .sort((a, b) => (b.appearances || 0) - (a.appearances || 0))
        .slice(0, 15);

      topUnassigned.forEach((u, idx) => {
        console.log(`${idx + 1}. ${u.name}`);
        console.log(`   ${u.suggestion}`);
      });

      if (this.results.unassigned.length > 15) {
        console.log(`\n   ... and ${this.results.unassigned.length - 15} more can be assigned\n`);
      }
    }

    // Show not found
    if (this.results.notFound.length > 0) {
      console.log(`\n🔵 NOT FOUND IN API-FOOTBALL (${this.results.notFound.length}):\n`);
      this.results.notFound.slice(0, 10).forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.name} (DB: ${p.dbTeam})`);
      });
      if (this.results.notFound.length > 10) {
        console.log(`\n   ... and ${this.results.notFound.length - 10} more\n`);
      }
    }

    console.log('\n📄 Full report saved to: ' + this.resultsFile);
    console.log('💾 Cache saved to: ' + this.cacheFile + ' (for resuming if interrupted)');
    console.log('\n' + '═'.repeat(70));
  }
}

const verifier = new RobustPlayerVerifier();
verifier.verify();
