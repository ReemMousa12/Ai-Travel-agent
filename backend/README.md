# AI Travel Agent - Backend

Backend API server for the AI Travel Agent application.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your API keys

3. Start the server:
```bash
npm run dev
```

The backend will run on http://localhost:3000

## API Endpoints

### Chat
- `POST /api/chat` - Process chat messages with AI

### Travel
- `GET /api/travel/weather?location=Paris` - Get weather
- `GET /api/travel/location` - Get user location
- `POST /api/travel/flights` - Search flights
- `POST /api/travel/hotels` - Search hotels
- `POST /api/travel/activities` - Search activities
- `POST /api/travel/restaurants` - Search restaurants

### Database
- `GET /api/database/trips?userId=user_123` - Get saved trips
- `POST /api/database/trips` - Save a trip
- `DELETE /api/database/trips/:id?userId=user_123` - Delete a trip
- `GET /api/database/bookmarks?userId=user_123` - Get bookmarks
- `POST /api/database/bookmarks` - Save a bookmark
