// Location Service - Detect user location and fetch nearby destinations
import { createClient } from '@supabase/supabase-js'

// Lazy-initialize Supabase client to avoid crashes on module load
let supabase = null

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        )
    }
    return supabase
}

// Detect user's current location (using IP geolocation)
export async function detectUserLocation() {
    try {
        // Use HTTPS endpoint to avoid browser blocks
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        
        if (data.error) {
            console.error('IP geolocation error:', data.reason)
            return null
        }
        
        return {
            country: data.country_name || 'Unknown',
            country_code: data.country_code || 'US',
            city: data.city || 'Unknown',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            timezone: data.timezone || ''
        }
    } catch (error) {
        console.error('Error detecting location:', error?.message)
        return null
    }
}

// Save user location to preferences
export async function saveUserLocation(userId, locationData) {
    try {
        const { error } = await getSupabase()
            .from('user_preferences')
            .upsert([{
                user_id: userId,
                current_location: locationData.city,
                current_country: locationData.country,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                updated_at: new Date().toISOString()
            }], { onConflict: 'user_id' })
        
        if (error) throw error
        return true
    } catch (error) {
        console.error('Error saving location:', error)
        return false
    }
}

// Get nearby destinations
export async function getNearbyDestinations(userCountry) {
    try {
        const { data, error } = await getSupabase()
            .from('nearby_destinations')
            .select('*')
            .eq('user_country', userCountry)
            .order('popularity_score', { ascending: false })
        
        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching nearby destinations:', error)
        return []
    }
}

// Mock hotel and activity data (replace with real APIs later)
export function getMockHotelsAndActivities(destination, activityPreferences = []) {
    const hotels = {
        'Mexico': [
            { id: 1, title: 'Cancun Beach Resort', location: 'Cancun', type: 'luxury', price: 250, rating: 4.8 },
            { id: 2, title: 'Playa del Carmen Hotel', location: 'Playa del Carmen', type: 'moderate', price: 120, rating: 4.5 },
            { id: 3, title: 'Tulum Budget Hostel', location: 'Tulum', type: 'budget', price: 30, rating: 4.2 }
        ],
        'Costa Rica': [
            { id: 4, title: 'San Jose Modern Hotel', location: 'San Jose', type: 'moderate', price: 100, rating: 4.4 },
            { id: 5, title: 'Manuel Antonio Beach Resort', location: 'Manuel Antonio', type: 'luxury', price: 200, rating: 4.7 },
            { id: 6, title: 'Fortuna Eco Lodge', location: 'La Fortuna', type: 'eco', price: 80, rating: 4.5 }
        ],
        'France': [
            { id: 7, title: 'Paris Luxury Hotel', location: 'Paris', type: 'luxury', price: 300, rating: 4.9 },
            { id: 8, title: 'Provence Country Hotel', location: 'Provence', type: 'moderate', price: 110, rating: 4.6 },
            { id: 9, title: 'Nice Budget Hotel', location: 'Nice', type: 'budget', price: 60, rating: 4.3 }
        ],
        'Thailand': [
            { id: 10, title: 'Bangkok City Hotel', location: 'Bangkok', type: 'luxury', price: 150, rating: 4.7 },
            { id: 11, title: 'Phuket Beach Resort', location: 'Phuket', type: 'moderate', price: 90, rating: 4.5 },
            { id: 12, title: 'Chiang Mai Hostel', location: 'Chiang Mai', type: 'budget', price: 25, rating: 4.4 }
        ]
    }
    
    const activities = {
        'Mexico': [
            { id: 101, title: 'Snorkeling in Cozumel', type: 'adventure', price: 50, duration: '4 hours' },
            { id: 102, title: 'Mayan Ruins Tour', type: 'culture', price: 40, duration: '5 hours' },
            { id: 103, title: 'Cenote Swimming', type: 'nature', price: 30, duration: '3 hours' },
            { id: 104, title: 'Beach Club Night', type: 'nightlife', price: 35, duration: '4 hours' }
        ],
        'Costa Rica': [
            { id: 105, title: 'Zip-lining Through Rainforest', type: 'adventure', price: 60, duration: '3 hours' },
            { id: 106, title: 'Volcano Hike', type: 'nature', price: 45, duration: '6 hours' },
            { id: 107, title: 'Sloth Watching', type: 'nature', price: 25, duration: '2 hours' },
            { id: 108, title: 'Wildlife Spotting', type: 'nature', price: 40, duration: '4 hours' }
        ],
        'France': [
            { id: 109, title: 'Eiffel Tower Tour', type: 'culture', price: 30, duration: '2 hours' },
            { id: 110, title: 'Wine Tasting', type: 'food', price: 75, duration: '3 hours' },
            { id: 111, title: 'Louvre Museum', type: 'culture', price: 20, duration: '3 hours' },
            { id: 112, title: 'River Seine Cruise', type: 'relaxation', price: 25, duration: '1.5 hours' }
        ],
        'Thailand': [
            { id: 113, title: 'Muay Thai Class', type: 'adventure', price: 35, duration: '2 hours' },
            { id: 114, title: 'Thai Cooking Class', type: 'food', price: 40, duration: '3 hours' },
            { id: 115, title: 'Temple Tour', type: 'culture', price: 20, duration: '4 hours' },
            { id: 116, title: 'Night Market Exploration', type: 'food', price: 25, duration: '3 hours' }
        ]
    }
    
    const destHotels = hotels[destination] || []
    const destActivities = activities[destination] || []
    
    return {
        destination,
        hotels: destHotels,
        activities: destActivities,
        total_options: destHotels.length + destActivities.length
    }
}

// Get comprehensive travel recommendations based on location
export async function getLocationBasedRecommendations(userId, userCountry, preferences = {}) {
    try {
        // Get nearby destinations
        const nearbyDestinations = await getNearbyDestinations(userCountry)
        
        if (nearbyDestinations.length === 0) {
            return {
                message: 'No nearby destinations found',
                recommendations: []
            }
        }
        
        // Get hotels and activities for top 3 nearby destinations
        const recommendations = nearbyDestinations.slice(0, 3).map(dest => {
            const data = getMockHotelsAndActivities(dest.nearby_country, preferences.activities)
            return {
                destination: dest.nearby_country,
                distance: dest.distance_km,
                travel_time: dest.travel_time_hours,
                best_season: dest.best_season,
                popularity: dest.popularity_score,
                ...data
            }
        })
        
        return {
            message: `Found ${recommendations.length} great nearby destinations!`,
            recommendations,
            user_location: userCountry
        }
    } catch (error) {
        console.error('Error getting recommendations:', error)
        return {
            message: 'Could not fetch recommendations',
            recommendations: []
        }
    }
}

export default {
    detectUserLocation,
    saveUserLocation,
    getNearbyDestinations,
    getMockHotelsAndActivities,
    getLocationBasedRecommendations
}
