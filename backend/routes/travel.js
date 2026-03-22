import express from 'express'
import https from 'https'
import { Groq } from 'groq-sdk'
import { searchFlights, searchHotels, searchActivities, searchRestaurants } from '../services/travel.js'
import { getCurrentWeather, getLocation } from '../services/basic.js'

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

// Initialize Groq client lazily
let groq = null
let groqError = null

function getGroq() {
    if (groqError) {
        return null
    }
    
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            groqError = new Error('GROQ_API_KEY not configured')
            console.warn('⚠️ GROQ_API_KEY not set - AI features disabled')
            return null
        }
        
        try {
            groq = new Groq({ apiKey })
        } catch (error) {
            groqError = error
            console.error('❌ Failed to initialize Groq:', error?.message)
            return null
        }
    }
    return groq
}

// GET /api/travel/weather?location=Paris
router.get('/weather', asyncHandler(async (req, res) => {
    const { location } = req.query
    if (!location) {
        return res.json({ success: true, weather: null, location: null })
    }
    const result = await getCurrentWeather({ location })
    res.json({ success: true, ...JSON.parse(result) })
}))

// GET /api/travel/location
router.get('/location', asyncHandler(async (req, res) => {
    const result = await getLocation()
    res.json({ success: true, ...JSON.parse(result) })
}))

// POST /api/travel/flights
router.post('/flights', asyncHandler(async (req, res) => {
    const result = await searchFlights(req.body)
    res.json({ success: true, ...JSON.parse(result) })
}))

// POST /api/travel/hotels
router.post('/hotels', asyncHandler(async (req, res) => {
    const result = await searchHotels(req.body)
    res.json({ success: true, ...JSON.parse(result) })
}))

// POST /api/travel/activities
router.post('/activities', asyncHandler(async (req, res) => {
    const result = await searchActivities(req.body)
    res.json({ success: true, ...JSON.parse(result) })
}))

// POST /api/travel/restaurants
router.post('/restaurants', asyncHandler(async (req, res) => {
    const result = await searchRestaurants(req.body)
    res.json({ success: true, ...JSON.parse(result) })
}))

// GET /api/travel/trending?location=City,Country
router.get('/trending', asyncHandler(async (req, res) => {
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
    
    // If APIs fail, use AI as fallback (if Groq available) or static fallback
    if (deals.length === 0 && destinations.length === 0) {
        console.log('APIs failed, attempting fallback...')
        const groqClient = getGroq()
        
        if (groqClient) {
            try {
                const aiPrompt = `Provide 4 real trending destinations and 4 real hotel deals near ${location} in JSON format with structure: {"destinations": [{"name": "City, Country", "price": 150, "rating": 4.8, "desc": "description"}], "deals": [{"name": "Hotel Name", "location": "City, Country", "price": 120, "oldPrice": 180, "rating": 4.5, "reviews": 150}]}`
                
                const completion = await groqClient.chat.completions.create({
                    messages: [{ role: 'user', content: aiPrompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 2000,
                })
                
                let response = completion.choices[0]?.message?.content || '{}'
                response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const aiData = JSON.parse(response)
                
                if (aiData.destinations?.length > 0) {
                    destinations.push(...aiData.destinations.slice(0, 4))
                }
                if (aiData.deals?.length > 0) {
                    deals.push(...aiData.deals.slice(0, 4))
                }
            } catch (aiError) {
                console.warn('AI fallback failed, using static data:', aiError?.message)
            }
        } else {
            console.warn('Groq not available, using static fallback data')
        }
        
        // If still no data, use static fallback
        if (destinations.length === 0 && deals.length === 0) {
            console.log('Using static fallback destinations and deals')
            destinations.push({
                name: 'Paris, France',
                price: 180,
                rating: 4.8,
                desc: 'City of light with iconic Eiffel Tower and world-class museums',
                image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'
            },
            {
                name: 'Barcelona, Spain',
                price: 160,
                rating: 4.7,
                desc: 'Mediterranean city with Gaudí architecture and vibrant culture',
                image: 'https://images.unsplash.com/photo-1562883676-8c5dcd2235bf?w=800'
            },
            {
                name: 'Rome, Italy',
                price: 150,
                rating: 4.9,
                desc: 'Ancient history meets modern charm in the Eternal City',
                image: 'https://images.unsplash.com/photo-1552832860-cfaf4901900d?w=800'
            },
            {
                name: 'Amsterdam, Netherlands',
                price: 140,
                rating: 4.6,
                desc: 'Canals, museums, and cycling through charming streets',
                image: 'https://images.unsplash.com/photo-1534530173927-c7fb627b20bd?w=800'
            })
            
            deals.push({
                name: 'Hotel Europa',
                location: 'Paris, France',
                price: 95,
                oldPrice: 140,
                rating: 4.5,
                reviews: 320,
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
            },
            {
                name: 'Barcelona Plaza',
                location: 'Barcelona, Spain',
                price: 110,
                oldPrice: 160,
                rating: 4.4,
                reviews: 280,
                image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
            },
            {
                name: 'Colosseum View',
                location: 'Rome, Italy',
                price: 105,
                oldPrice: 155,
                rating: 4.7,
                reviews: 450,
                image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
            },
            {
                name: 'Canal House Amsterdam',
                location: 'Amsterdam, Netherlands',
                price: 120,
                oldPrice: 170,
                rating: 4.3,
                reviews: 200,
                image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
            })
        }
        
        // Add fallback images to remaining items if needed
        const fallbackDestinationImages = [
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            'https://images.unsplash.com/photo-1534008757030-27299c4371b6?w=800',
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
        ]
        
        const fallbackHotelImages = [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
        ]
        
        destinations.forEach((d, i) => { if (!d.image) d.image = fallbackDestinationImages[i % 4] })
        deals.forEach((d, i) => { if (!d.image) d.image = fallbackHotelImages[i % 4] })
    }
    
    res.json({ success: true, destinations, deals })
}))

export default router
