import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';
import { searchTeam } from './server/services/apiFootballService.js';

async function mapTeamsToApiFootball() {
  console.log('🔍 Mapping Wikidata teams to API-Football...\n');

  try {
    // Get all teams that don't have an API-Football ID yet
    const teamsResult = await query(`
      SELECT DISTINCT t.id, t.name
      FROM teams t
      WHERE t.api_football_id IS NULL
      ORDER BY t.name
      LIMIT 50
    `);

    console.log(`📊 Found ${teamsResult.rows.length} teams to map\n`);

    let mapped = 0;
    let notFound = 0;

    for (const team of teamsResult.rows) {
      console.log(`🔍 Searching for: ${team.name}`);
      
      try {
        const results = await searchTeam(team.name);
        
        if (results.length > 0) {
          // Take the first result (usually most relevant)
          const apiTeam = results[0].team;
          
          console.log(`  ✅ Found: ${apiTeam.name} (ID: ${apiTeam.id})`);
          
          // Update team with API-Football ID and logo
          await query(`
            UPDATE teams 
            SET api_football_id = $1, logo = $2
            WHERE id = $3
          `, [apiTeam.id, apiTeam.logo, team.id]);
          
          mapped++;
        } else {
          console.log(`  ❌ Not found in API-Football`);
          notFound++;
        }
        
        // Rate limiting - wait 1 second between searches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ⚠️  Error: ${error.message}`);
        notFound++;
      }
    }

    console.log('\n✅ Team mapping completed!');
    console.log(`📈 Results:`);
    console.log(`  ✅ Mapped: ${mapped} teams`);
    console.log(`  ❌ Not found: ${notFound} teams`);
    console.log(`\n💡 Now you can run: npm run sync:matches`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

mapTeamsToApiFootball();
