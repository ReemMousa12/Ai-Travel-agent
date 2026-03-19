# Favorites Feature Documentation

## Overview

The Favorites feature allows users to save and manage their favorite destinations, hotels, activities, and flights. It includes functionality to:
- Add destinations to a personal favorites list
- Categorize favorites by type (destination, hotel, activity, flight)
- Mark favorites as visited
- Add notes and ratings
- Filter and search through favorites
- Track estimated prices and trip dates

## Database Schema

### Favorites Table
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  type TEXT DEFAULT 'destination' CHECK (type IN ('destination', 'hotel', 'activity', 'flight')),
  reason TEXT,
  description TEXT,
  image_url TEXT,
  notes TEXT,
  price_estimate NUMERIC(10, 2),
  rating NUMERIC(2, 1) CHECK (rating >= 1 AND rating <= 5),
  visited BOOLEAN DEFAULT FALSE,
  visit_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_destination ON favorites(destination);
CREATE INDEX idx_favorites_visited ON favorites(visited);

-- Row Level Security (RLS)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to favorites" ON favorites USING (true);
```

## API Endpoints

### 1. Get All Favorites
```
GET /api/favorites?userId=USER_ID&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "favorites": [
    {
      "id": "uuid",
      "user_id": "user123",
      "destination": "Giza Pyramids",
      "country": "Egypt",
      "type": "destination",
      "reason": "Adventure, History",
      "description": "Ancient wonder",
      "image_url": "https://...",
      "notes": "Go in early morning",
      "price_estimate": 50,
      "rating": 4.8,
      "visited": false,
      "visit_date": null,
      "created_at": "2024-01-01T10:00:00",
      "updated_at": "2024-01-01T10:00:00"
    }
  ],
  "count": 1
}
```

### 2. Add Favorite
```
POST /api/favorites

Body:
{
  "userId": "user123",
  "destination": "Giza Pyramids",
  "country": "Egypt",
  "type": "destination",           // optional: destination | hotel | activity | flight
  "reason": "Adventure",            // optional
  "description": "Ancient wonder",  // optional
  "imageUrl": "https://...",       // optional
  "priceEstimate": 50,             // optional
  "rating": 4.8                    // optional
}
```

**Response:**
```json
{
  "success": true,
  "favorite": { ...favorite object... },
  "message": "Added to favorites"
}
```

### 3. Remove Favorite
```
DELETE /api/favorites/:id?userId=USER_ID
```

**Response:**
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

### 4. Update Favorite
```
PUT /api/favorites/:id

Body:
{
  "userId": "user123",
  "visited": true,                 // optional
  "visitDate": "2024-01-15",      // optional
  "notes": "Amazing experience!",  // optional
  "reason": "Updated reason"       // optional
}
```

**Response:**
```json
{
  "success": true,
  "favorite": { ...updated favorite object... },
  "message": "Updated favorite"
}
```

### 5. Filter Favorites
```
GET /api/favorites/filter?userId=USER_ID&type=destination&reason=adventure&visited=false
```

**Query Parameters:**
- `userId` (required): User ID
- `type` (optional): 'destination', 'hotel', 'activity', or 'flight'
- `reason` (optional): Filter by reason
- `visited` (optional): 'true' or 'false'

**Response:**
```json
{
  "success": true,
  "favorites": [...],
  "count": 5
}
```

## Frontend Components

### 1. FavoriteButton Component
Add a heart icon button to any destination card.

```tsx
import { FavoriteButton } from '@/components/FavoriteButton'

<FavoriteButton
  userId={userId}
  destination="Giza Pyramids"
  country="Egypt"
  type="destination"
  imageUrl="https://..."
  rating={4.8}
  showText={true}
  onToggle={(isFavorited) => console.log('Toggled:', isFavorited)}
/>
```

**Props:**
- `userId` (required): Current user ID
- `destination` (required): Destination name
- `country` (required): Country code
- `type` (optional): 'destination' | 'hotel' | 'activity' | 'flight'
- `imageUrl` (optional): Image URL
- `rating` (optional): Rating number
- `showText` (optional): Show text alongside icon
- `onToggle` (optional): Callback when favorite is toggled
- `className` (optional): Custom CSS classes

### 2. FavoritesList Component
Display all user favorites with filtering and management options.

```tsx
import { FavoritesList } from '@/components/FavoritesList'

<FavoritesList
  userId={userId}
  onRemove={(favoriteId) => console.log('Removed:', favoriteId)}
/>
```

**Features:**
- Filter by type (destination, hotel, activity, flight)
- Show visited vs. wishlist items
- Mark as visited/unvisited
- Remove from favorites
- Display price estimates and ratings
- Show visit dates and notes

### 3. FavoritesPanel Component
Compact dashboard widget showing favorites summary and recent items.

```tsx
import { FavoritesPanel } from '@/components/FavoritesPanel'

<FavoritesPanel userId={userId} />
```

**Features:**
- Total favorites count
- Visited count
- Wishlist count
- Recent 5 favorites preview
- Quick "View All" button

### 4. AddFavoriteModal Component
Modal form to add a new favorite with full details.

```tsx
import { AddFavoriteModal } from '@/components/AddFavoriteModal'

const [isOpen, setIsOpen] = useState(false)

<AddFavoriteModal
  userId={userId}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(favorite) => console.log('Added:', favorite)}
  prefilledData={{
    destination: 'Giza Pyramids',
    country: 'Egypt',
    type: 'destination',
    imageUrl: 'https://...'
  }}
/>
```

## API Client Methods

All methods are available through the `apiClient` instance in `src/lib/api.ts`:

```tsx
import { apiClient } from '@/lib/api'

// Add favorite
const favorite = await apiClient.addFavorite(userId, 'Cairo', 'Egypt', {
  reason: 'Business trip',
  rating: 4.5
})

// Get all favorites
const favorites = await apiClient.getFavorites(userId)

// Remove favorite
const success = await apiClient.removeFavorite(favoriteId, userId)

// Update favorite (mark visited, add notes)
const updated = await apiClient.updateFavorite(favoriteId, userId, {
  visited: true,
  notes: 'Amazing experience!'
})

// Filter favorites
const filtered = await apiClient.filterFavorites(userId, {
  type: 'destination',
  visited: false
})
```

## Integration Examples

### Add Favorite Button to Destination Card
```tsx
import { FavoriteButton } from '@/components/FavoriteButton'

function DestinationCard({ destination, userId }) {
  return (
    <div className="card">
      <h3>{destination.name}</h3>
      <FavoriteButton
        userId={userId}
        destination={destination.name}
        country={destination.country}
        imageUrl={destination.image}
        rating={destination.rating}
        showText={true}
      />
    </div>
  )
}
```

### Add Favorites Section to Dashboard
```tsx
import { FavoritesPanel } from '@/components/FavoritesPanel'

function Dashboard({ userId }) {
  return (
    <div className="dashboard">
      <FavoritesPanel userId={userId} />
      {/* Other dashboard components */}
    </div>
  )
}
```

### Open Add Favorite Modal from Chat
```tsx
import { AddFavoriteModal } from '@/components/AddFavoriteModal'

function ChatInterface({ userId }) {
  const [showModal, setShowModal] = useState(false)

  const handleAddFavoriteClick = (destination, country) => {
    setShowModal(true)
    // Modal will be pre-filled via prefilledData prop
  }

  return (
    <>
      <AddFavoriteModal
        userId={userId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        prefilledData={{ destination, country }}
      />
    </>
  )
}
```

## Error Handling

All API methods include error handling:
- Return `null` on API errors
- Return empty array for list endpoints on errors
- Return `false` for boolean endpoints on errors
- Console errors logged for debugging

**Example:**
```tsx
const favorite = await apiClient.addFavorite(userId, destination, country)
if (!favorite) {
  console.warn('Could not add favorite.')
  // Show user-friendly error message
}
```

## Performance Considerations

- **Indexes**: Database includes indexes on `user_id`, `destination`, and `visited` for fast queries
- **Pagination**: List endpoints support `limit` and `offset` parameters
- **Lazy Loading**: Components load favorites on mount and cache results
- **RLS Policies**: Database uses Row Level Security for data isolation

## Future Enhancements

- [ ] Share favorite lists with other users
- [ ] Export favorites to PDF/CSV
- [ ] Collaborative wishlists for group trips
- [ ] Integration with booking platforms
- [ ] Favorite collections/albums
- [ ] Social sharing features
- [ ] Price drop alerts for favorites
- [ ] Calendar integration with visit dates

## Troubleshooting

### Favorites not showing
1. Ensure database schema is deployed to Supabase
2. Check user ID is correct
3. Verify SUPABASE_URL and SUPABASE_ANON_KEY are set
4. Check browser console for error messages

### Can't add favorites
1. Verify user authentication is working
2. Check if `favorites` table exists in Supabase
3. Ensure RLS policies are enabled
4. Verify network connectivity to backend

### Slow favorite queries
1. Check database indexes are created
2. Consider pagination for large lists
3. Review Supabase dashboard for slow query logs

## Database Reset

If you need to reset the favorites table:

```sql
-- Drop existing table and policies
DROP TABLE IF EXISTS public.favorites CASCADE;

-- Run the schema creation script again
-- (See database-schema.sql in root of project)
```
