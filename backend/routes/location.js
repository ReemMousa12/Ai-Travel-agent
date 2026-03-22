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

// GET /api/location/current
// Detect user's current location from IP
router.get('/current', async (req, res) => {
    try {
        console.log('📍 /api/location/current called');
        const location = await detectUserLocation()
        console.log('📍 detectUserLocation returned:', location);
        if (!location) {
            console.warn('⚠️ Location is null, returning error');
            return res.json({ success: false, error: 'Could not detect location', location: null })
        }
        console.log('✅ Returning location:', location);
        res.json({ success: true, location })
    } catch (error) {
        console.error('❌ Error detecting location:', error?.message)
        console.error('Stack trace:', error);
        res.json({ success: false, error: 'Could not detect location', location: null })
    }
})

// GET /api/location/diagnose
// Diagnostic endpoint to help debug location detection
router.get('/diagnose', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('❌ Diagnostic error:', error?.message)
        res.json({ 
            success: false, 
            error: error?.message || 'Diagnostic failed',
            timestamp: new Date().toISOString()
        })
    }
})

// GET /api/location/test-services
// Test geolocation services directly
router.get('/test-services', async (req, res) => {
    try {
        console.log('\n🧪 === TEST SERVICES ENDPOINT CALLED ===');
        await testLocationServices()
        
        res.json({ 
            success: true,
            message: 'Service tests completed - check server logs for output',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('❌ Service test error:', error?.message)
        res.json({ 
            success: false,
            error: error?.message || 'Service test failed',
            timestamp: new Date().toISOString()
        })
    }
})

// POST /api/location/save
// Save user location to preferences
router.post('/save', async (req, res) => {
    try {
        const { userId, locationData } = req.body
        
        if (!userId || !locationData) {
            return res.json({ success: true, message: 'Missing userId or locationData', saved: false })
        }
        
        const success = await saveUserLocation(userId, locationData)
        res.json({ success: true, message: 'Location processed', saved: success })
    } catch (error) {
        console.error('Error saving location:', error?.message)
        res.json({ success: true, message: 'Error processing location', saved: false })
    }
})

// GET /api/location/nearby?country=USA
// Get nearby destinations for a country
router.get('/nearby', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error fetching nearby:', error?.message)
        res.json({ success: true, user_country: null, nearby_destinations: [], count: 0 })
    }
})

// GET /api/location/recommendations?userId=USER_ID&country=USA
// Get full recommendations (hotels + activities) for nearby destinations
router.get('/recommendations', async (req, res) => {
    try {
        const { userId, country, activities } = req.query
        
        if (!country) {
            return res.json({ success: true, message: 'Missing country parameter', recommendations: [] })
        }
        
        const preferences = activities ? { activities: activities.split(',') } : {}
        const recommendations = await getLocationBasedRecommendations(userId, country, preferences)
        
        res.json({ success: true, ...recommendations })
    } catch (error) {
        console.error('Error fetching recommendations:', error?.message)
        res.json({ success: true, message: 'Could not fetch recommendations', recommendations: [] })
    }
})

// GET /api/location/explore?destination=Mexico
// Get hotels and activities for a specific destination
router.get('/explore', async (req, res) => {
    try {
        const { destination, interests } = req.query
        
        if (!destination) {
            return res.json({ success: true, destination: null, hotels: [], activities: [], total_options: 0 })
        }
        
        const activities = interests ? interests.split(',') : []
        const data = getMockHotelsAndActivities(destination, activities)
        
        res.json({ success: true, ...data })
    } catch (error) {
        console.error('Error exploring destination:', error?.message)
        res.json({ success: true, destination: null, hotels: [], activities: [], total_options: 0 })
    }
})

export default router
