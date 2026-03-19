import express from 'express'
import { 
    detectUserLocation, 
    saveUserLocation, 
    getNearbyDestinations,
    getMockHotelsAndActivities,
    getLocationBasedRecommendations 
} from '../services/location.js'

const router = express.Router()

// GET /api/location/current
// Detect user's current location from IP
router.get('/current', async (req, res) => {
    try {
        const location = await detectUserLocation()
        if (!location) {
            return res.json({ success: false, error: 'Could not detect location', location: null })
        }
        res.json({ success: true, location })
    } catch (error) {
        console.error('Error detecting location:', error?.message)
        res.json({ success: false, error: 'Could not detect location', location: null })
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
