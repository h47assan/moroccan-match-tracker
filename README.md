# Moroccan Match Tracker ⚽🇲🇦

A full-stack web application to track Moroccan football players, their matches, transfers, and statistics across global leagues.

## 🌟 Features

- 📊 **Player Tracking** - Database of 900+ Moroccan players from Wikidata
- ⚽ **Live Matches** - Real-time match tracking via API-Football integration
- 🔄 **Transfers** - Track player movements between clubs
- 🏆 **Multi-League Support** - Coverage across 48+ leagues worldwide
- 🎯 **Smart Filtering** - Filter by league, team, position, date
- 🔴 **Live Scores** - Real-time score updates for ongoing matches

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- API-Football account (free tier available)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd moroccan-match-tracker

# Install dependencies
npm install

# Configure environment
cp .env.example server/.env
# Edit server/.env with your database and API credentials

# Run database migration
node add-api-football-columns.js

# Start the backend server
npm run server

# In another terminal, start the frontend
npm run dev
```

### Get API-Football Key
1. Visit [API-Football](https://www.api-football.com/)
2. Register for free (100 requests/day)
3. Copy your API key
4. Add to `server/.env`: `API_FOOTBALL_KEY=your_key_here`

### Sync Data
```bash
# Sync Moroccan players from Wikidata
node quick-sync.js

# Sync upcoming matches from API-Football
npm run sync:matches

# Update live match scores
npm run sync:live
```

## 📚 Documentation

- **[QUICK_START_API_FOOTBALL.md](QUICK_START_API_FOOTBALL.md)** - Get started with API-Football in 3 steps
- **[API_FOOTBALL_SETUP.md](API_FOOTBALL_SETUP.md)** - Detailed API-Football integration guide

## 🏗️ Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Query for data fetching

### Backend
- Node.js + Express
- PostgreSQL database
- Wikidata SPARQL API
- API-Football REST API

## 📁 Project Structure

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
