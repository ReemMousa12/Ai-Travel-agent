import express from 'express'
import { 
    detectUserLocation, 
    saveUserLocation, 
    getNearbyDestinations,
    getMockHotelsAndActivities,
    getLocationBasedRecommendations 
} from '../services/location.js'
import { testLocationServices } from '../services/basic.js'

const router = express.Router()

// Wrapper to catch async errors - more robust for serverless
const asyncHandler = (fn) => (req, res, next) => {
    try {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            console.error('❌ Route handler error:', err?.message || err)
            next(err)
        })
    } catch (err) {
        console.error('❌ Async handler error:', err?.message || err)
        next(err)
    }
}

// GET /api/location/current
// Detect user's current location from IP
router.get('/current', asyncHandler(async (req, res) => {
    console.log('📍 /api/location/current called');
    
    // Log available headers for debugging Vercel geolocation
    console.log('📍 Request headers available:');
    console.log('  - x-vercel-ip-timezone:', req.get('x-vercel-ip-timezone'));
    console.log('  - x-forwarded-for:', req.get('x-forwarded-for'));
    console.log('  - cf-connecting-ip:', req.get('cf-connecting-ip'));
    
    const location = await detectUserLocation()
    console.log('📍 detectUserLocation returned:', location);
    if (!location) {
        console.warn('⚠️ Location is null, returning error');
        return res.json({ success: false, error: 'Could not detect location', location: null })
    }
    console.log('✅ Returning location:', location);
    res.json({ success: true, location })
}))

// GET /api/location/diagnose
// Diagnostic endpoint to help debug location detection
router.get('/diagnose', asyncHandler(async (req, res) => {
    console.log('\n🔍 === DIAGNOSTIC ENDPOINT CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Client IP from req:', req.ip || req.connection.remoteAddress);
    console.log('Starting location detection...\n');
    
    const location = await detectUserLocation()
    
    console.log('🔍 === DIAGNOSTIC RESULT ===');
    console.log('Location object:', JSON.stringify(location, null, 2));
    console.log('Detection completed at:', new Date().toISOString());
    console.log('🔍 === END DIAGNOSTIC ===\n');
    
    res.json({ 
        success: true, 
        timestamp: new Date().toISOString(),
        diagnostic: 'Check server logs for detailed detection flow',
        location: location || null,
        detected_city: location?.city || 'UNKNOWN',
        detected_country: location?.country || 'UNKNOWN'
    })
}))

// GET /api/location/test-services
// Test geolocation services directly
router.get('/test-services', asyncHandler(async (req, res) => {
    console.log('\n🧪 === TEST SERVICES ENDPOINT CALLED ===');
    await testLocationServices()
    
    res.json({ 
        success: true,
        message: 'Service tests completed - check server logs for output',
        timestamp: new Date().toISOString()
    })
}))

// POST /api/location/save
// Save user location to preferences
router.post('/save', asyncHandler(async (req, res) => {
    const { userId, locationData } = req.body
    
    if (!userId || !locationData) {
        return res.json({ success: true, message: 'Missing userId or locationData', saved: false })
    }
    
    const success = await saveUserLocation(userId, locationData)
    res.json({ success: true, message: 'Location processed', saved: success })
}))

// GET /api/location/nearby?country=USA
// Get nearby destinations for a country
router.get('/nearby', asyncHandler(async (req, res) => {
    const { country } = req.query
    
    if (!country) {
        return res.json({ success: true, user_country: null, nearby_destinations: [], count: 0 })
    }
    
    const destinations = await getNearbyDestinations(country)
    res.json({ 
        success: true, 
        user_country: country,
        nearby_destinations: destinations,
        count: destinations.length 
    })
}))

// GET /api/location/recommendations?userId=USER_ID&country=USA
// Get full recommendations (hotels + activities) for nearby destinations
router.get('/recommendations', asyncHandler(async (req, res) => {
    const { userId, country, activities } = req.query
    
    if (!country) {
        return res.json({ success: true, message: 'Missing country parameter', recommendations: [] })
    }
    
    const preferences = activities ? { activities: activities.split(',') } : {}
    const recommendations = await getLocationBasedRecommendations(userId, country, preferences)
    
    res.json({ success: true, ...recommendations })
}))

// GET /api/location/explore?destination=Mexico
// Get hotels and activities for a specific destination
router.get('/explore', asyncHandler(async (req, res) => {
    const { destination, interests } = req.query
    
    if (!destination) {
        return res.json({ success: true, destination: null, hotels: [], activities: [], total_options: 0 })
    }
    
    const activities = interests ? interests.split(',') : []
    const data = getMockHotelsAndActivities(destination, activities)
    
    res.json({ success: true, ...data })
}))

// GET /api/location/geocode?latitude=51.5074&longitude=-0.1278
// Reverse geocode coordinates to city/country (called by frontend to avoid CORS)
// Uses Nominatim (OpenStreetMap) free API
router.get('/geocode', asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.query
    
    if (!latitude || !longitude) {
        return res.json({ 
            success: false, 
            error: 'latitude and longitude required',
            city: 'Unknown',
            country: 'Unknown',
            countryCode: 'XX'
        })
    }
    
    console.log('🌍 Backend geocoding request:', { latitude, longitude });
    
    // Call Nominatim (OpenStreetMap) API from backend (no CORS issues here)
    // Nominatim is more reliable than Open-Meteo for reverse geocoding
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
            headers: { 
                'User-Agent': 'AI-Travel-Agent/1.0',
                'Accept-Language': 'en'
            }
        }
    )
    
    if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('🌍 Nominatim response:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Extract city and country from Nominatim response
    const address = data.address
    if (!address) {
        throw new Error('No address data found in geocoding response')
    }
    
    // Try to get city from different possible fields
    const city = address.city || address.town || address.village || address.municipality || 'Unknown'
    // Country in English and country code
    const country = address.country || 'Unknown'
    const countryCode = address.country_code?.toUpperCase() || 'XX'
    
    console.log('✅ Backend geocoding successful:', { city, country, countryCode });
    
    res.json({ 
        success: true,
        city,
        country,
        countryCode
    })
}))

export default router
