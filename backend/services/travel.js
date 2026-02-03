// Travel API services

export async function searchFlights({ origin, destination, departureDate, returnDate = null, passengers = 1, maxPrice = null }) {
    try {
        const apiKey = process.env.AMADEUS_API_KEY
        const apiSecret = process.env.AMADEUS_API_SECRET
        
        // Get access token
        const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`
        })
        
        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token
        
        // Build query parameters
        const params = new URLSearchParams({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departureDate,
            adults: passengers.toString(),
            max: '10'
        })
        
        if (returnDate) {
            params.append('returnDate', returnDate)
        }
        
        if (maxPrice) {
            params.append('maxPrice', maxPrice.toString())
        }
        
        // Search flights
        const flightResponse = await fetch(
            `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        )
        
        const flightData = await flightResponse.json()
        return JSON.stringify(flightData)
    } catch (err) {
        console.error('Flight search error:', err)
        return JSON.stringify({ error: err.message })
    }
}

export async function searchHotels({ location, checkInDate, checkOutDate, adults = 1, priceRange = null }) {
    try {
        const rapidApiKey = process.env.RAPIDAPI_KEY
        
        const searchUrl = new URL('https://booking-com.p.rapidapi.com/v1/hotels/search')
        searchUrl.searchParams.append('dest_type', 'city')
        searchUrl.searchParams.append('dest_id', location)
        searchUrl.searchParams.append('checkin_date', checkInDate)
        searchUrl.searchParams.append('checkout_date', checkOutDate)
        searchUrl.searchParams.append('adults_number', adults.toString())
        searchUrl.searchParams.append('order_by', 'popularity')
        searchUrl.searchParams.append('page_number', '0')
        
        if (priceRange) {
            searchUrl.searchParams.append('price_filter', priceRange)
        }
        
        const response = await fetch(searchUrl, {
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
            }
        })
        
        const data = await response.json()
        return JSON.stringify(data)
    } catch (err) {
        console.error('Hotel search error:', err)
        return JSON.stringify({ error: err.message })
    }
}

export async function searchActivities({ location, category = null }) {
    try {
        const rapidApiKey = process.env.RAPIDAPI_KEY
        
        if (!rapidApiKey || rapidApiKey === 'your_rapidapi_key_here') {
            // Return helpful mock data if API key not configured
            return JSON.stringify({
                success: true,
                location: location,
                activities: [
                    { name: `${location} Cultural Tour`, rating: 4.8, price: "$45-$75" },
                    { name: `${location} Adventure`, rating: 4.7, price: "$60-$90" }
                ],
                note: "Configure RAPIDAPI_KEY in backend/.env for live data"
            })
        }
        
        // First, search for the location to get its ID
        const locationSearch = await fetch(
            `https://travel-advisor.p.rapidapi.com/locations/search?query=${encodeURIComponent(location)}`,
            {
                headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
                }
            }
        )
        
        const locationData = await locationSearch.json()
        
        if (!locationData.data || locationData.data.length === 0) {
            return JSON.stringify({ 
                error: `Could not find location: ${location}`,
                suggestion: "Try a major city or tourist destination name"
            })
        }
        
        const locationId = locationData.data[0].result_object.location_id
        
        // Now get attractions for this location
        const attractionsUrl = new URL('https://travel-advisor.p.rapidapi.com/attractions/list')
        attractionsUrl.searchParams.append('location_id', locationId)
        attractionsUrl.searchParams.append('currency', 'USD')
        attractionsUrl.searchParams.append('lang', 'en_US')
        attractionsUrl.searchParams.append('lunit', 'km')
        
        const response = await fetch(attractionsUrl, {
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
            }
        })
        
        const data = await response.json()
        return JSON.stringify(data)
    } catch (err) {
        console.error('Activities search error:', err)
        return JSON.stringify({ error: err.message })
    }
}

export async function searchRestaurants({ location, cuisine = null, priceLevel = null }) {
    try {
        const rapidApiKey = process.env.RAPIDAPI_KEY
        
        if (!rapidApiKey || rapidApiKey === 'your_rapidapi_key_here') {
            return JSON.stringify({
                success: true,
                location: location,
                restaurants: [
                    { name: `${location} Fine Dining`, rating: 4.7, price: "$$$$" },
                    { name: `Local ${location} Eatery`, rating: 4.9, price: "$$" }
                ],
                note: "Configure RAPIDAPI_KEY in backend/.env for live data"
            })
        }
        
        // Search for location first
        const locationSearch = await fetch(
            `https://travel-advisor.p.rapidapi.com/locations/search?query=${encodeURIComponent(location)}`,
            {
                headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
                }
            }
        )
        
        const locationData = await locationSearch.json()
        
        if (!locationData.data || locationData.data.length === 0) {
            return JSON.stringify({ 
                error: `Could not find location: ${location}`,
                suggestion: "Try a major city name"
            })
        }
        
        const locationId = locationData.data[0].result_object.location_id
        
        // Get restaurants
        const restaurantsUrl = new URL('https://travel-advisor.p.rapidapi.com/restaurants/list')
        restaurantsUrl.searchParams.append('location_id', locationId)
        restaurantsUrl.searchParams.append('currency', 'USD')
        restaurantsUrl.searchParams.append('lang', 'en_US')
        
        const response = await fetch(restaurantsUrl, {
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
            }
        })
        
        const data = await response.json()
        return JSON.stringify(data)
    } catch (err) {
        console.error('Restaurant search error:', err)
        return JSON.stringify({ error: err.message })
    }
}

export async function getTravelRecommendations({ destination, interests = [], budget = 'moderate', travelStyle = 'balanced' }) {
    try {
        const recommendations = {
            destination,
            budget,
            travelStyle,
            suggestions: {
                bestTimeToVisit: "Based on current weather patterns",
                mustSee: "Top attractions based on your interests",
                hiddenGems: "Lesser-known spots you'll love",
                foodScene: "Restaurant and cuisine recommendations",
                budgetTips: "Ways to save money during your trip"
            },
            interests,
            message: `I'll help you plan an amazing trip to ${destination}! Let me gather information about flights, hotels, and activities.`
        }
        
        return JSON.stringify(recommendations)
    } catch (err) {
        console.error('Recommendations error:', err)
        return JSON.stringify({ error: err.message })
    }
}
