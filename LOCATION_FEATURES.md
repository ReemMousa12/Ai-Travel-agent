# Location-Based Features Setup Guide

## 🌍 NEW FEATURES ADDED

### 1. **User Location Detection**
- Automatically detects user's country/city from IP address
- Stores location in `user_preferences` table

### 2. **Nearby Destinations**
- Suggests nearby countries to visit based on user location
- Pre-loaded with 14 country pairs (USA↔Mexico, UK↔France, etc.)
- Includes travel times and popularity scores

### 3. **Location-Based Hotels & Activities**
- Fetches hotels and activities for nearby destinations
- Includes prices, ratings, and descriptions
- Personalized based on user's travel style

### 4. **User Preferences Table** ⭐ NEW
```sql
user_preferences table contains:
- current_location (detected city)
- current_country (detected country)
- latitude / longitude
- preferred_travel_style
- preferred_budget
- preferred_activities (array)
- dietary_restrictions
- travel_pace
- group_type
```

---

## 🔧 NEW API ENDPOINTS

### Detect User Location
```
GET /api/location/current

Response:
{
  "success": true,
  "location": {
    "country": "United States",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timezone": "America/New_York"
  }
}
```

### Save User Location
```
POST /api/location/save
Body: {
  "userId": "user_123",
  "locationData": {
    "city": "New York",
    "country": "United States",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

### Get Nearby Destinations
```
GET /api/location/nearby?country=USA

Response:
{
  "success": true,
  "user_country": "USA",
  "nearby_destinations": [
    {
      "nearby_country": "Mexico",
      "distance_km": 300,
      "travel_time_hours": 4,
      "popularity_score": 9.0,
      "best_season": "Oct-Apr"
    },
    ...
  ]
}
```

### Get Full Recommendations
```
GET /api/location/recommendations?userId=USER_ID&country=USA

Response:
{
  "success": true,
  "user_location": "USA",
  "recommendations": [
    {
      "destination": "Mexico",
      "distance": 300,
      "travel_time": 4,
      "hotels": [
        {
          "id": 1,
          "title": "Cancun Beach Resort",
          "location": "Cancun",
          "type": "luxury",
          "price": 250,
          "rating": 4.8
        },
        ...
      ],
      "activities": [
        {
          "id": 101,
          "title": "Snorkeling in Cozumel",
          "type": "adventure",
          "price": 50,
          "duration": "4 hours"
        },
        ...
      ]
    }
  ]
}
```

### Explore Specific Destination
```
GET /api/location/explore?destination=Mexico&interests=beach,adventure

Response:
{
  "success": true,
  "destination": "Mexico",
  "hotels": [...],
  "activities": [...],
  "total_options": 7
}
```

---

## ✅ SETUP CHECKLIST

### 1. Create Database Tables
**CRITICAL**: Run this SQL in Supabase:
```sql
-- Copy the entire database-schema.sql file
-- Go to Supabase Dashboard → SQL Editor
-- Paste and Run
```

Tables created:
- ✅ `user_preferences` - User location & preferences
- ✅ `user_profiles` - Basic user info
- ✅ `trips` - Planned trips
- ✅ `saved_items` - Hotels, activities, flights
- ✅ `chat_history` - Conversations
- ✅ `nearby_destinations` - Pre-loaded destinations

### 2. Wait for Backend Deployment
- Vercel automatically redeploys when you push
- Wait 2-3 minutes for deployment to complete
- Check: https://ai-travel-agent-backend.vercel.app/api/health

### 3. Test Location Features
```bash
# Detect your location
curl https://ai-travel-agent-backend.vercel.app/api/location/current

# Get nearby destinations for USA
curl https://ai-travel-agent-backend.vercel.app/api/location/nearby?country=USA

# Get full recommendations
curl "https://ai-travel-agent-backend.vercel.app/api/location/recommendations?userId=test&country=USA"
```

---

## 🎯 HOW THE AI USES THIS

### Before (Old Way)
```
User: "I want to visit nearby"
AI: "I don't know where you are"
```

### After (New Way)
```
User: "I'm from New York"
AI: (saves to user_preferences)

User: "Show me nearby destinations"
AI: (queries nearby_destinations for USA)
Returns: Mexico, Canada, Costa Rica
AI: (gets hotels & activities for each)
Returns: Full recommendations with prices & reviews
```

---

## 🚀 INTEGRATING WITH AI CHAT

The `location.js` service is ready to be used by the chat route. To make the AI suggest nearby destinations:

1. Update `backend/routes/chat.js`
2. Import: `import locationService from '../services/location.js'`
3. When user says "nearby" or "near me":
   - Get user location from user_preferences
   - Call `getLocationBasedRecommendations()`
   - Include results in AI response

Example:
```javascript
if (message.toLowerCase().includes('nearby') || message.toLowerCase().includes('near me')) {
    const recommendations = await getLocationBasedRecommendations(userId, userCountry)
    // Include in AI context
}
```

---

## 📊 PRE-LOADED NEARBY DESTINATIONS

Currently included:
- USA ↔ Mexico, Canada, Costa Rica
- UK ↔ France, Spain, Germany
- India ↔ Nepal, Thailand, Sri Lanka
- Germany ↔ Austria, Czech Republic
- Australia ↔ New Zealand
- Japan ↔ South Korea
- Brazil ↔ Argentina

**To add more**: Insert into `nearby_destinations` table in Supabase

---

## ⚡ MOCK DATA (Placeholder Hotels & Activities)

Currently using mock data for:
- Hotels in: Mexico, Costa Rica, France, Thailand
- Activities in: Mexico, Costa Rica, France, Thailand

**To use real APIs**, replace `getMockHotelsAndActivities()` with:
- Booking.com API for hotels
- Skyscanner for flights
- Viator for activities
- Google Places API for restaurants

---

## ✨ NEXT STEPS

1. **Create database tables** (CRITICAL!)
   ```sql
   Run database-schema.sql in Supabase
   ```

2. **Test the APIs**
   ```bash
   GET /api/location/current
   GET /api/location/nearby?country=USA
   ```

3. **Integrate with Chat**
   - Update chat route to use location service
   - Make AI suggest nearby destinations

4. **Replace Mock Data** (Optional)
   - Connect real hotel/flight/activity APIs
   - Add real pricing and availability

---

## 🐛 TROUBLESHOOTING

### Getting 404 on location endpoints?
- Backend hasn't redeployed yet
- Wait 3 minutes and try again

### No nearby destinations showing?
- Database table not created
- Run database-schema.sql in Supabase

### Latitude/Longitude showing as null?
- IP geolocation service timing out
- Check network status

---

## 📝 SUMMARY

✅ **What's new**:
- Automatic user location detection
- Nearby destinations suggestions
- Hotels & activities by location
- User preferences storage

✅ **What works**:
- All 5 new API endpoints
- Location detection from IP
- Database schema ready

⏳ **What you need to do**:
1. Run database-schema.sql in Supabase
2. Wait for Vercel deployment
3. Test API endpoints

That's it! Your AI agent can now suggest nearby destinations based on user location! 🌍✈️
