# 🎯 Quick Start: API-Football Integration

## ✅ What's Done

Your Moroccan Match Tracker now has full API-Football integration! Here's what was added:

### 📦 New Files Created
- `server/services/apiFootballService.js` - Complete API-Football integration service
- `sync-matches.js` - Fetch upcoming fixtures for Moroccan players
- `sync-live-matches.js` - Update live match scores
- `add-api-football-columns.js` - Database migration (already run ✅)
- `API_FOOTBALL_SETUP.md` - Detailed documentation

### 🗄️ Database Updates
✅ Added `api_football_id` columns to:
- `leagues` table
- `teams` table  
- `matches` table

✅ Updated match status to include 'cancelled'
✅ Created indexes for performance

### 🛠️ New API Endpoints
- `POST /api/matches/sync` - Manually trigger match sync
- `GET /api/matches/live` - Get currently live matches

### 📜 NPM Scripts Added
- `npm run sync:matches` - Sync upcoming matches
- `npm run sync:live` - Update live match scores

---

## 🚀 Get Started in 3 Steps

### Step 1: Get Your API Key (2 minutes)
1. Visit: https://www.api-football.com/
2. Click "REGISTER" (top right)
3. Complete registration
4. Go to your dashboard and copy your API key

**Free tier includes:**
- ✅ 100 requests per day
- ✅ Access to 960+ competitions
- ✅ Live scores and fixtures
- ✅ Player lineups

### Step 2: Add API Key to .env
Open `server/.env` and update:
```env
API_FOOTBALL_KEY=your_actual_api_key_here
```

### Step 3: Sync Your First Matches!
```bash
npm run sync:matches
```

This will:
- Find all teams with Moroccan players
- Fetch their next 10 upcoming fixtures
- Store matches in your database
- Link Moroccan players to their matches

---

## 📊 Usage Examples

### Sync Upcoming Matches (Run once or twice daily)
```bash
npm run sync:matches
```

### Monitor Live Matches (Run every 2-5 minutes during match time)
```bash
npm run sync:live
```

### Manual Sync via API
```bash
curl -X POST http://localhost:3001/api/matches/sync
```

### Get Live Matches
```bash
curl http://localhost:3001/api/matches/live
```

---

## 💡 What Happens When You Sync?

1. **Finds Moroccan Players** → Queries your database for all Moroccan players
2. **Gets Their Teams** → Finds which teams these players belong to
3. **Fetches Fixtures** → Gets upcoming matches from API-Football
4. **Auto-Creates Data** → Creates teams/leagues if they don't exist
5. **Links Players** → Associates Moroccan players with their matches
6. **Updates Scores** → Keeps match scores and status current

---

## 🎮 Features

✅ **Automatic Team/League Creation** - No manual data entry needed
✅ **Smart Player Linking** - Moroccan players automatically linked to matches
✅ **Live Score Updates** - Real-time match status tracking
✅ **Multi-League Support** - Tracks players across all leagues
✅ **Rate Limit Friendly** - Built-in delays to respect API limits
✅ **Status Tracking** - scheduled → live → finished → cancelled

---

## 📈 Rate Limits & Best Practices

### Free Tier (100 requests/day)
- **Sync upcoming matches**: 2x per day (morning & evening)
- **Live updates**: Only during active match times
- Each team = 1 request, so plan accordingly

### Example Schedule
```
8:00 AM  - Sync upcoming matches (50 requests)
6:00 PM  - Sync upcoming matches (50 requests)

During matches (2:00 PM - 11:00 PM):
  Every 3 minutes - Update live scores (1-5 requests)
```

---

## 🔄 Automation Ideas

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 8:00 AM)
4. Action: Start a program
   - Program: `node`
   - Arguments: `sync-matches.js`
   - Start in: `C:\Users\Hassan\moroccan-match-tracker`

### Cron (Linux/Mac)
```bash
# Sync matches twice daily
0 8,20 * * * cd /path/to/project && npm run sync:matches

# Update live during peak hours (every 3 min)
*/3 14-23 * * * cd /path/to/project && npm run sync:live
```

---

## 🐛 Troubleshooting

### "API-Football error: 401"
- Check your API key is correct in `server/.env`
- Verify your API key is active on api-football.com

### "No live matches at the moment"
- This is normal when no matches are being played
- Run during actual match times

### "Rate limit exceeded"
- You've used your 100 daily requests
- Wait until tomorrow or upgrade plan
- Check: https://dashboard.api-football.com/

### "Column api_football_id does not exist"
- Run: `node add-api-football-columns.js`

---

## 📚 API-Football Resources

- **Documentation**: https://www.api-football.com/documentation-v3
- **Dashboard**: https://dashboard.api-football.com/
- **Status Page**: https://status.api-football.com/
- **Support**: contact@api-football.com

---

## 🎯 Next Steps

1. ✅ Get API key
2. ✅ Add to .env
3. ✅ Run first sync
4. 📱 Update frontend to show live match indicators
5. 🔔 Add notifications when Moroccan players score
6. 📊 Show player statistics from matches
7. 🎨 Create live score widget
8. ⚙️ Set up automated sync schedule

---

## 📝 Need Help?

Check the detailed documentation:
- `API_FOOTBALL_SETUP.md` - Complete setup guide
- `server/services/apiFootballService.js` - Service implementation
- API-Football docs: https://www.api-football.com/documentation-v3

---

**You're all set! 🎉**

Start by running: `npm run sync:matches`
