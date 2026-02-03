# AI Travel Agent

A full-stack AI-powered travel planning application with separate backend and frontend.

## Architecture

- **Frontend**: Vite + Vanilla JavaScript (client-side)
- **Backend**: Node.js + Express (server-side API)
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq (Llama 3.3)

## Setup Instructions

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `backend/.env`:
   - GROQ_API_KEY
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - AMADEUS_API_KEY
   - AMADEUS_API_SECRET
   - RAPIDAPI_KEY

4. Start backend server:
```bash
npm run dev
```

Backend runs on http://localhost:3000

### Frontend Setup

1. In the root directory, install dependencies:
```bash
npm install
```

2. Configure `.env`:
```
VITE_BACKEND_URL=http://localhost:3000
```

3. Start frontend:
```bash
npm run dev
```

Frontend runs on http://localhost:3001 (or next available port)

## Database Setup

1. Create Supabase project at https://supabase.com/
2. Run the SQL from `database-schema.sql` in Supabase SQL Editor
3. Add Supabase credentials to `backend/.env`

## Features

- ✈️ Flight search and recommendations
- 🏨 Hotel search based on location & budget
- 🎯 Activity suggestions based on weather & interests
- 💾 Save and track trips
- 🌤️ Smart weather-based recommendations
- 👤 User authentication with separate data per user
- 💬 AI-powered chat interface

## API Keys

Get your free API keys from:
- **Groq AI**: https://console.groq.com/
- **Supabase**: https://supabase.com/
- **Amadeus** (flights): https://developers.amadeus.com/
- **RapidAPI** (hotels/activities): https://rapidapi.com/
