// Basic utility functions

export async function getCurrentWeather({ location }) {
    try {
        const weatherUrl = new URL("https://apis.scrimba.com/openweathermap/data/2.5/weather")
        weatherUrl.searchParams.append("q", location)
        weatherUrl.searchParams.append("units", "metric")
        const res = await fetch(weatherUrl)
        const data = await res.json()
        return JSON.stringify(data)
    } catch(err) {
        console.error(err.message)
        return JSON.stringify({ error: err.message })
    }
}

export async function getLocation() {
    try {
        // Using ip-api.com HTTPS version - free, no API key needed
        // Fallback to ipapi.co if ip-api fails
        try {
            const response = await fetch('https://ipapi.co/json/')
            const data = await response.json()
            
            if (data.error) {
                throw new Error(data.reason || 'Location detection failed')
            }
            
            const locationData = {
                city: data.city || 'Unknown',
                country: data.country_code || 'US',
                country_name: data.country_name || 'United States',
                region: data.region || '',
                latitude: data.latitude || 0,
                longitude: data.longitude || 0,
                timezone: data.timezone || ''
            }
            
            return JSON.stringify(locationData)
        } catch (primaryError) {
            console.warn('Primary location service failed, trying fallback:', primaryError?.message)
            
            // Fallback to ip-api with HTTPS
            const response = await fetch('https://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp&ssl=true')
            const data = await response.json()
            
            if (data.status === 'fail') {
                throw new Error(data.message || 'IP geolocation failed')
            }
            
            const locationData = {
                city: data.city || 'Unknown',
                country: data.countryCode || 'US',
                country_name: data.country || 'United States',
                region: data.regionName || '',
                latitude: data.lat || 0,
                longitude: data.lon || 0,
                timezone: data.timezone || '',
                org: data.isp || ''
            }
            
            return JSON.stringify(locationData)
        }
    } catch (err) {
        console.error('Location detection error:', err?.message)
        return JSON.stringify({ 
            error: err?.message || 'Could not detect location',
            city: 'London',
            country: 'GB',
            country_name: 'United Kingdom',
            latitude: 51.5074,
            longitude: -0.1278
        })
    }
}
