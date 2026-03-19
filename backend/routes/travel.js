import express from 'express'
import Groq from 'groq-sdk'
import https from 'https'
import { searchFlights, searchHotels, searchActivities, searchRestaurants } from '../services/travel.js'
import { getCurrentWeather, getLocation } from '../services/basic.js'

const router = express.Router()

// Initialize Groq client lazily
let groq = null
function getGroq() {
    if (!groq && process.env.GROQ_API_KEY) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        })
    }
    return groq
}

// GET /api/travel/weather?location=Paris
router.get('/weather', async (req, res) => {
    try {
        const { location } = req.query
        if (!location) {
            return res.json({ success: true, weather: null, location: null })
        }
        const result = await getCurrentWeather({ location })
        res.json({ success: true, ...JSON.parse(result) })
    } catch (error) {
        console.error('Weather error:', error?.message)
        res.json({ success: true, weather: null, location: null })
    }
})

// GET /api/travel/location
router.get('/location', async (req, res) => {
    try {
        const result = await getLocation()
        res.json({ success: true, ...JSON.parse(result) })
    } catch (error) {
        console.error('Location error:', error?.message)
        res.json({ success: true, location: null })
    }
})

// POST /api/travel/flights
router.post('/flights', async (req, res) => {
    try {
        const result = await searchFlights(req.body)
        res.json({ success: true, ...JSON.parse(result) })
    } catch (error) {
        console.error('Flights error:', error?.message)
        res.json({ success: true, flights: [], message: 'Could not search flights' })
    }
})

// POST /api/travel/hotels
router.post('/hotels', async (req, res) => {
    try {
        const result = await searchHotels(req.body)
        res.json({ success: true, ...JSON.parse(result) })
    } catch (error) {
        console.error('Hotels error:', error?.message)
        res.json({ success: true, hotels: [], message: 'Could not search hotels' })
    }
})

// POST /api/travel/activities
router.post('/activities', async (req, res) => {
    try {
        const result = await searchActivities(req.body)
        res.json({ success: true, ...JSON.parse(result) })
    } catch (error) {
        console.error('Activities error:', error?.message)
        res.json({ success: true, activities: [], message: 'Could not search activities' })
    }
})

// POST /api/travel/restaurants
router.post('/restaurants', async (req, res) => {
    try {
        const result = await searchRestaurants(req.body)
        res.json({ success: true, ...JSON.parse(result) })
    } catch (error) {
        console.error('Restaurants error:', error?.message)
        res.json({ success: true, restaurants: [], message: 'Could not search restaurants' })
    }
})

// GET /api/travel/trending?location=City,Country
router.get('/trending', async (req, res) => {
    try {
        const { location } = req.query
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
        const UNSPLASH_ACCESS_KEY = 'T1mDI5Q4HV4k4M6434I97b_apJb_P_Fc3VFmxcMeaQ0'
        
        // Fallback images in case Unsplash API fails
        const fallbackDestinationImages = [
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
            'https://images.unsplash.com/photo-1534008757030-27299c4371b6?w=800&q=80',
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
            'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
            'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=800&q=80',
        ]
        
        const fallbackHotelImages = [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
            'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800&q=80',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
        ]
        
        // Simple hash function for fallback selection
        function hashString(str) {
            let hash = 0
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i)
                hash = hash & hash
            }
            return Math.abs(hash)
        }
        
        // Fetch image from Unsplash API
        async function fetchUnsplashImage(query, fallbackImages) {
            return new Promise((resolve) => {
                try {
                    const searchQuery = encodeURIComponent(query)
                    const options = {
                        hostname: 'api.unsplash.com',
                        path: `/search/photos?query=${searchQuery}&per_page=15&orientation=landscape`,
                        headers: {
                            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                        }
                    }
                    
                    https.get(options, (response) => {
                        let data = ''
                        response.on('data', (chunk) => { data += chunk })
                        response.on('end', () => {
                            try {
                                const result = JSON.parse(data)
                                
                                if (result.results && result.results.length > 0) {
                                    const randomIndex = Math.floor(Math.random() * Math.min(result.results.length, 10))
                                    const imageUrl = result.results[randomIndex].urls.regular
                                    console.log(`✓ Unsplash image fetched for "${query}"`)
                                    resolve(imageUrl)
                                } else {
                                    const hash = hashString(query.toLowerCase())
                                    const fallbackUrl = fallbackImages[hash % fallbackImages.length]
                                    console.log(`→ Using fallback for "${query}"`)
                                    resolve(fallbackUrl)
                                }
                            } catch (error) {
                                const hash = hashString(query.toLowerCase())
                                const fallbackUrl = fallbackImages[hash % fallbackImages.length]
                                console.error(`✗ Unsplash parse error for "${query}":`, error.message)
                                resolve(fallbackUrl)
                            }
                        })
                    }).on('error', (error) => {
                        const hash = hashString(query.toLowerCase())
                        const fallbackUrl = fallbackImages[hash % fallbackImages.length]
                        console.error(`✗ Unsplash request error for "${query}":`, error.message)
                        resolve(fallbackUrl)
                    })
                } catch (error) {
                    const hash = hashString(query.toLowerCase())
                    const fallbackUrl = fallbackImages[hash % fallbackImages.length]
                    console.error(`✗ Exception in fetchUnsplashImage for "${query}":`, error.message)
                    resolve(fallbackUrl)
                }
            })
        }
        
        // Helper function to make RapidAPI requests
        async function fetchRapidAPI(url, options) {
            try {
                const options = {
                    hostname: 'booking-com.p.rapidapi.com',
                    path: `/v1/hotels/search?location=${encodeURIComponent(location)}&adults_number=2&room_number=1&checkin_date=${getCheckinDate()}&checkout_date=${getCheckoutDate()}&locale=en-us&currency=USD&units=metric`,
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
                    }
                }
                
                const url = `https://${options.hostname}${options.path}`
                const data = await fetchRapidAPI(url, options)
                
                console.log('Booking.com API response:', JSON.stringify(data, null, 2))
                
                // Extract top 4 deals
                const deals = (data.result || []).slice(0, 4).map((hotel, idx) => ({
                    name: hotel.hotel_name || `Hotel ${idx + 1}`,
                    location: `${hotel.city || location}, ${hotel.country_trans || ''}`.trim(),
                    image: hotel.max_photo_url || hotel.main_photo_url || `https://images.unsplash.com/photo-${['1566073771259-6a8506099945', '1571896349842-33c89424de2d', '1542314831-068cd1dbfeeb', '1551882547-ff40c63fe5fa'][idx]}?w=800`,
                    price: Math.round(hotel.min_total_price || hotel.composite_price_breakdown?.gross_amount_per_night?.value || (80 + Math.random() * 120)),
                    oldPrice: Math.round((hotel.min_total_price || 120) * 1.4), // 40% discount
                    rating: parseFloat((hotel.review_score || 4.0).toFixed(1)),
                    reviews: hotel.review_nr || Math.round(50 + Math.random() * 200)
                }))
                
                console.log('Processed deals:', deals)
                return deals
            } catch (error) {
                console.error('Booking API error:', error.message)
                return []
            }
        }
        
        // Fetch trending destinations using AI
        async function fetchTrendingDestinationsWithAI(location) {
            try {
                const aiPrompt = `Provide 4 trending travel destinations within 500km of ${location}. These should be real, popular cities or tourist destinations. Return only valid JSON array:
[{"name": "City, Country", "price": 150, "rating": 4.5, "desc": "Brief description"}]`
                
                const completion = await getGroq()?.chat.completions.create({
                    messages: [{ role: 'user', content: aiPrompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 1000,
                })
                
                let response = completion.choices[0]?.message?.content || '[]'
                response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const aiDestinations = JSON.parse(response)
                
                // Fetch real images from Unsplash API
                const destinations = await Promise.all(aiDestinations.map(async (dest) => {
                    const cityName = dest.name.split(',')[0].trim()
                    const image = await fetchUnsplashImage(cityName, fallbackDestinationImages)
                    return { ...dest, image }
                }))
                
                console.log('AI-generated destinations:', destinations)
                return destinations
            } catch (error) {
                console.error('AI destinations error:', error.message)
                return []
            }
        }
        
        // Fetch hotel deals using AI (since Booking.com requires subscription)
        async function fetchHotelDealsWithAI(location) {
            try {
                const aiPrompt = `Provide 4 real popular hotels near ${location} in JSON format. Return only valid JSON:
[{"name": "Hotel Name", "location": "City, Country", "price": 120, "oldPrice": 180, "rating": 4.5, "reviews": 150}]`
                
                const completion = await getGroq()?.chat.completions.create({
                    messages: [{ role: 'user', content: aiPrompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 1000,
                })
                
                let response = completion.choices[0]?.message?.content || '[]'
                response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const aiDeals = JSON.parse(response)
                
                // Fetch real images from Unsplash API
                const deals = await Promise.all(aiDeals.map(async (deal) => {
                    const cityName = deal.location.split(',')[0].trim()
                    const searchQuery = `luxury hotel ${cityName}`
                    const image = await fetchUnsplashImage(searchQuery, fallbackHotelImages)
                    return { ...deal, image }
                }))
                
                console.log('AI-generated deals:', deals)
                return deals
            } catch (error) {
                console.error('AI hotel deals error:', error.message)
                return []
            }
        }
        
        // Helper functions for dates
        function getCheckinDate() {
            const date = new Date()
            date.setDate(date.getDate() + 7) // 7 days from now
            return date.toISOString().split('T')[0]
        }
        
        function getCheckoutDate() {
            const date = new Date()
            date.setDate(date.getDate() + 10) // 10 days from now
            return date.toISOString().split('T')[0]
        }
        
        console.log(`Fetching real data for location: ${location}`)
        
        // Fetch destinations and hotels using AI
        const [destinations, deals] = await Promise.all([
            fetchTrendingDestinationsWithAI(location),
            fetchHotelDealsWithAI(location)
        ])
        
        // If APIs fail, use AI as fallback
        if (deals.length === 0 && destinations.length === 0) {
            console.log('APIs failed, using AI fallback')
            const aiPrompt = `Provide 4 real trending destinations and 4 real hotel deals near ${location} in JSON format with structure: {"destinations": [{"name": "City, Country", "price": 150, "rating": 4.8, "desc": "description"}], "deals": [{"name": "Hotel Name", "location": "City, Country", "price": 120, "oldPrice": 180, "rating": 4.5, "reviews": 150}]}`
            
            const completion = await getGroq()?.chat.completions.create({
                messages: [{ role: 'user', content: aiPrompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 2000,
            })
            
            let response = completion.choices[0]?.message?.content || '{}'
            response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const aiData = JSON.parse(response)
            
            // Add fallback images
            const fallbackDestinations = [
                'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                'https://images.unsplash.com/photo-1534008757030-27299c4371b6?w=800',
                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
            ]
            
            const fallbackHotels = [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
                'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
            ]
            
            if (aiData.destinations) {
                aiData.destinations = aiData.destinations.map((d, i) => ({ ...d, image: fallbackDestinations[i % 4] }))
            }
            if (aiData.deals) {
                aiData.deals = aiData.deals.map((d, i) => ({ ...d, image: fallbackHotels[i % 4] }))
            }
            
            return res.json(aiData)
        }
        
        res.json({ success: true, destinations, deals })
    } catch (error) {
        console.error('Trending error:', error?.message)
        res.json({ success: true, destinations: [], deals: [], message: 'Could not fetch trending' })
    }
})

export default router
