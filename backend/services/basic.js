// Test function to debug location detection services
export async function testLocationServices() {
    console.log('\n🧪 === TESTING LOCATION SERVICES ===');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // Test ipapi.co
        console.log('\n1️⃣ Testing ipapi.co...');
        try {
            const ipapiRespo = await fetch('https://ipapi.co/json/')
            const ipapiData = await ipapiRespo.json()
            console.log('   ✅ ipapi.co Response:', JSON.stringify(ipapiData, null, 2));
        } catch (e) {
            console.log('   ❌ ipapi.co failed:', e?.message);
        }
        
        // Test ip-api.com
        console.log('\n2️⃣ Testing ip-api.com...');
        try {
            const ipapiResponse = await fetch('https://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp')
            const ipapiData = await ipapiResponse.json()
            console.log('   ✅ ip-api.com Response:', JSON.stringify(ipapiData, null, 2));
        } catch (e) {
            console.log('   ❌ ip-api.com failed:', e?.message);
        }
        
        // Test ipstack.com (alternative)
        console.log('\n3️⃣ Testing ipgeolocation.io (free tier)...');
        try {
            const stackResponse = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=test')
            const stackData = await stackResponse.json()
            console.log('   ✅ ipgeolocation.io Response:', JSON.stringify(stackData, null, 2));
        } catch (e) {
            console.log('   ❌ ipgeolocation.io failed:', e?.message);
        }
        
        console.log('\n🧪 === TEST COMPLETED ===\n');
    } catch (err) {
        console.error('❌ Test error:', err?.message);
    }
}

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
        // Priority 1: Try ipapi.co (most reliable, free, returns city name)
        // Priority 2: Fall back to ip-api.com if ipapi.co fails
        // Priority 3: Try ipgeolocation.io free tier
        // Priority 4: Return hardcoded fallback (London, GB)
        
        try {
            console.log('🌍 [basic.js] Detecting user location via ipapi.co...');
            console.log('🌍 [basic.js] Fetching from: https://ipapi.co/json/');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
            clearTimeout(timeoutId);
            console.log('🌍 [basic.js] ipapi.co response status:', response.status, response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} from ipapi.co`)
            }
            
            const data = await response.json()
            console.log('🌍 [basic.js] ipapi.co raw response:', JSON.stringify(data));
            
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
            
            console.log('✅ [basic.js] Location detected (ipapi.co):', locationData.city, locationData.country);
            return JSON.stringify(locationData)
        } catch (primaryError) {
            console.error('❌ [basic.js] ipapi.co failed:', primaryError?.message)
            
            // Fallback to ip-api with HTTPS
            console.log('🌍 [basic.js] Detecting user location via ip-api.com...');
            try {
                console.log('🌍 [basic.js] Fetching from: https://ip-api.com/json/');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch('https://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp&ssl=true', { signal: controller.signal })
                clearTimeout(timeoutId);
                console.log('🌍 [basic.js] ip-api.com response status:', response.status, response.ok);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} from ip-api.com`)
                }
                
                const data = await response.json()
                console.log('🌍 [basic.js] ip-api.com raw response:', JSON.stringify(data));
                
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
                
                console.log('✅ [basic.js] Location detected (ip-api.com):', locationData.city, locationData.country);
                return JSON.stringify(locationData)
            } catch (secondaryError) {
                console.error('❌ [basic.js] ip-api.com also failed:', secondaryError?.message);
                
                // Third fallback: ipgeolocation.io free tier
                try {
                    console.log('🌍 [basic.js] Detecting user location via ipgeolocation.io...');
                    console.log('🌍 [basic.js] Fetching from: https://api.ipgeolocation.io/ipgeo');
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    const response = await fetch('https://api.ipgeolocation.io/ipgeo', { signal: controller.signal })
                    clearTimeout(timeoutId);
                    console.log('🌍 [basic.js] ipgeolocation.io response status:', response.status, response.ok);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status} from ipgeolocation.io`)
                    }
                    
                    const data = await response.json()
                    console.log('🌍 [basic.js] ipgeolocation.io raw response:', JSON.stringify(data));
                    
                    if (!data.city) {
                        throw new Error('No city in response')
                    }
                    
                    const locationData = {
                        city: data.city || 'Unknown',
                        country: data.country_code2 || 'US',
                        country_name: data.country_name || 'United States',
                        latitude: data.latitude || 0,
                        longitude: data.longitude || 0,
                        timezone: data.timezone?.name || ''
                    }
                    
                    console.log('✅ [basic.js] Location detected (ipgeolocation.io):', locationData.city, locationData.country);
                    return JSON.stringify(locationData)
                } catch (tertiaryError) {
                    console.error('❌ [basic.js] ipgeolocation.io also failed:', tertiaryError?.message);
                    throw tertiaryError
                }
            }
        }
    } catch (err) {
        console.error('❌ [basic.js] ALL location services failed!');
        console.error('❌ [basic.js] Final error:', err?.message)
        console.error('❌ [basic.js] Full error:', err);
        console.log('📍 [basic.js] Using fallback location: London, GB');
        return JSON.stringify({ 
            error: `All services failed: ${err?.message}`,
            city: 'London',
            country: 'GB',
            country_name: 'United Kingdom',
            latitude: 51.5074,
            longitude: -0.1278
        })
    }
}
