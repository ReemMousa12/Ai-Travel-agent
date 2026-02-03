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
        // Using ip-api.com - free, no API key needed, better rate limits (45 requests/minute)
        const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp')
        const data = await response.json()
        
        // Check if the API returned an error
        if (data.status === 'fail') {
            console.error('IP geolocation failed:', data.message)
            return JSON.stringify({ error: data.message })
        }
        
        // Transform to match expected format
        const locationData = {
            city: data.city,
            country: data.countryCode,
            country_name: data.country,
            region: data.regionName,
            latitude: data.lat,
            longitude: data.lon,
            timezone: data.timezone,
            org: data.isp
        }
        
        return JSON.stringify(locationData)
    } catch (err) {
        console.error(err.message)
        return JSON.stringify({ error: err.message })
    }
}
