# API-Football Integration

This project now integrates with [API-Football](https://www.api-football.com/) to track live matches featuring Moroccan players.

## Setup

### 1. Get Your API Key
1. Visit [API-Football](https://www.api-football.com/)
2. Sign up for a free account (100 requests/day on free tier)
3. Get your API key from the dashboard

### 2. Configure Environment
Add your API key to `server/.env`:
```env
API_FOOTBALL_KEY=your_actual_api_key_here
```

### 3. Run Database Migration
Apply the schema changes to support API-Football data:
```bash
psql -h your_host -U your_user -d your_database -f database/migration-api-football.sql
```

Or run the fix-schema script:
```bash
node fix-schema.js
```

## Usage

### Sync Matches
Fetch upcoming fixtures for all teams with Moroccan players:
```bash
node sync-matches.js
```

This will:
- Find all teams with Moroccan players
- Fetch next 10 upcoming fixtures for each team
- Create/update matches in database
- Link Moroccan players to their matches
- Auto-create teams and leagues as needed

### Monitor Live Matches
Check and update live match scores:
```bash
node sync-live-matches.js
```

Run this periodically (e.g., every 2-5 minutes during match days) to track live updates.

### API Endpoints

#### Sync Matches (Backend)
```http
POST /api/matches/sync
```
Triggers a manual sync of upcoming matches from API-Football.

#### Get Live Matches
```http
GET /api/matches/live
```
Returns currently live matches from API-Football.

#### Existing Endpoints
```http
GET /api/matches?date=today&league=ligue1
GET /api/matches/leagues
```

## Data Flow

1. **Wikidata** → Moroccan players and their current teams
2. **API-Football** → Match fixtures, scores, and live updates
3. **Database** → Centralized storage linking players to matches

## Rate Limits

- **Free Tier**: 100 requests/day
- **Pro Tier**: 1,000+ requests/day

Each sync operation makes approximately 1 request per team. Plan your sync frequency accordingly.

## Automation Ideas

### Cron Jobs (Linux/Mac)
```bash
# Sync matches twice daily
0 8,20 * * * cd /path/to/project && node sync-matches.js

# Update live matches every 3 minutes during peak hours
*/3 14-23 * * * cd /path/to/project && node sync-live-matches.js
```

### Windows Task Scheduler
Create scheduled tasks to run:
- `sync-matches.js` - 2x daily
- `sync-live-matches.js` - Every 3-5 minutes during match days

## Features

✅ Automatic team and league creation
✅ Match status tracking (scheduled, live, finished, cancelled)
✅ Score updates
✅ Player-to-match linking
✅ Multi-league support
✅ Venue information
✅ Rate limit friendly

## Next Steps

Consider implementing:
- Player lineup data
- Match statistics
- Player performance in matches
- Push notifications for Moroccan player goals
- Live score widget on frontend

## Documentation

- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [Available Endpoints](https://www.api-football.com/documentation-v3#section/Introduction)
