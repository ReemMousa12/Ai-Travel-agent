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
            return res.status(400).json({ error: 'Could not detect location' })
        }
        res.json({ success: true, location })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// POST /api/location/save
// Save user location to preferences
router.post('/save', async (req, res) => {
    try {
        const { userId, locationData } = req.body
        
        if (!userId || !locationData) {
            return res.status(400).json({ error: 'userId and locationData required' })
        }
        
        const success = await saveUserLocation(userId, locationData)
        res.json({ success, message: 'Location saved' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// GET /api/location/nearby?country=USA
// Get nearby destinations for a country
router.get('/nearby', async (req, res) => {
    try {
        const { country } = req.query
        
        if (!country) {
            return res.status(400).json({ error: 'country parameter required' })
        }
        
        const destinations = await getNearbyDestinations(country)
        res.json({ 
            success: true, 
            user_country: country,
            nearby_destinations: destinations,
            count: destinations.length 
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// GET /api/location/recommendations?userId=USER_ID&country=USA
// Get full recommendations (hotels + activities) for nearby destinations
router.get('/recommendations', async (req, res) => {
    try {
        const { userId, country, activities } = req.query
        
        if (!country) {
            return res.status(400).json({ error: 'country parameter required' })
        }
        
        const preferences = activities ? { activities: activities.split(',') } : {}
        const recommendations = await getLocationBasedRecommendations(userId, country, preferences)
        
        res.json({ success: true, ...recommendations })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// GET /api/location/explore?destination=Mexico
// Get hotels and activities for a specific destination
router.get('/explore', async (req, res) => {
    try {
        const { destination, interests } = req.query
        
        if (!destination) {
            return res.status(400).json({ error: 'destination parameter required' })
        }
        
        const activities = interests ? interests.split(',') : []
        const data = getMockHotelsAndActivities(destination, activities)
        
        res.json({ success: true, ...data })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
