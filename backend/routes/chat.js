import express from 'express'
import { Groq } from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Initialize Groq client lazily to ensure env vars are loaded
let groq = null
function getGroq() {
    if (!groq) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in environment variables')
        }
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        })
    }
    return groq
}

// Initialize Supabase client
let supabase = null
function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        )
    }
    return supabase
}

// POST /api/chat
router.post('/', async (req, res) => {
    try {
        const { message, userId, messages, model = 'llama-3.3-70b-versatile', sessionId, userName: providedUserName } = req.body

        // Fetch user location preferences and nearby destinations
        let locationContext = ''
        let nearbyContext = ''
        let userName = providedUserName || '' // Use provided userName from request
        let locationStatus = 'No location data found' // Track why location wasn't loaded
        
        if (userId) {
            try {
                const { data, error: fetchError } = await getSupabase()
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .single()
                
                if (fetchError) {
                    console.log('⚠️ Error fetching user preferences:', fetchError.message);
                    locationStatus = 'Could not fetch location from database';
                } else if (!data) {
                    console.log('ℹ️ No user preferences record found for userId:', userId);
                    locationStatus = 'Location data not yet created';
                } else if (!data.current_location || !data.current_country) {
                    console.log('ℹ️ Location fields empty - current_location:', data.current_location, 'current_country:', data.current_country);
                    locationStatus = 'Location is being detected but not yet saved';
                } else {
                    // Location data is available!
                    let locDetails = `User's current location: ${data.current_location}, ${data.current_country}`;
                    if (data.latitude && data.longitude) {
                        locDetails += ` (Coordinates: ${data.latitude}, ${data.longitude})`;
                    }
                    locationContext = `\n\n${locDetails}. Use this location to provide personalized travel recommendations, nearby attractions, weather, and local information.`;
                    console.log('✅ Location context loaded:', locDetails);
                    locationStatus = 'Location loaded successfully';
                    
                    // Fetch nearby destinations for this country
                    try {
                        const { data: nearbyDestinations } = await getSupabase()
                            .from('nearby_destinations')
                            .select('*')
                            .eq('user_country', data.current_country)
                            .order('popularity_score', { ascending: false })
                            .limit(5);
                        
                        if (nearbyDestinations && nearbyDestinations.length > 0) {
                            const nearbyList = nearbyDestinations.map(dest => 
                                `• ${dest.nearby_country} (${dest.distance_km}km away, ${dest.travel_time_hours}h travel, Popularity: ${dest.popularity_score}/10, Best Season: ${dest.best_season})`
                            ).join('\n');
                            
                            nearbyContext = `\n\nNearby Travel Destinations:\n${nearbyList}\n\nWhen user asks for nearby country suggestions, recommend from this list with details about travel distance, time, and best season.`;
                            console.log('✅ Nearby destinations loaded:', nearbyDestinations.length, 'countries');
                        }
                    } catch (nearbyError) {
                        console.log('ℹ️ Could not load nearby destinations:', nearbyError?.message);
                    }
                }
                
                // Only override with database name if no name was provided in request
                if (!userName && data && data.user_name) {
                    userName = data.user_name
                }
                
                // Save the userName to database if provided and not already saved
                if (providedUserName && (!data || !data.user_name)) {
                    await getSupabase()
                        .from('user_preferences')
                        .upsert([{ 
                            user_id: userId, 
                            user_name: providedUserName,
                            updated_at: new Date().toISOString()
                        }], { onConflict: 'user_id' })
                }
            } catch (error) {
                console.error('❌ Unexpected error loading user preferences:', error?.message);
                locationStatus = 'Error loading location data';
            }
        }

        // Support both formats: single message or messages array
        let chatMessages
        if (messages && Array.isArray(messages)) {
            chatMessages = messages
        } else if (message) {
            // Convert single message to messages array
            let systemPrompt = '';
            
            if (locationContext) {
                // We have location data - provide full personalized context
                systemPrompt = userName 
                    ? `You are an expert AI travel assistant specializing in personalized travel recommendations. The user's name is ${userName}.${locationContext}${nearbyContext}

PERSONALIZATION GUIDELINES:
- Use the user's name naturally in conversations to build rapport
- When recommending destinations, prioritize those near their current location when relevant
- Consider suggesting nearby countries as quick getaway options
- Provide climate/weather insights for their current location and suggested destinations
- Tailor recommendations based on proximity to reduce travel time and cost
- When suggesting travel itineraries, account for their starting location
- Ask about travel preferences, budget, and interests to refine recommendations

RECOMMENDATIONS APPROACH:
1. For "what should I visit" questions: Suggest nearby destinations first, then expand globally
2. For "travel tips": Provide location-specific advice about their current area
3. For flight recommendations: Compare options from their current location
4. For itinerary planning: Start from their location as the departure point

Always maintain enthusiasm about travel and help create memorable trip experiences!`
                    : `You are an expert AI travel assistant specializing in personalized travel recommendations.${locationContext}${nearbyContext}

PERSONALIZATION GUIDELINES:
- When recommending destinations, prioritize those near the user's current location when relevant
- Consider suggesting nearby countries as quick getaway options
- Provide climate/weather insights for the user's location and suggested destinations
- Tailor recommendations based on proximity to reduce travel time and cost
- When suggesting travel itineraries, account for their starting location
- Ask about travel preferences, budget, and interests to refine recommendations

RECOMMENDATIONS APPROACH:
1. For "what should I visit" questions: Suggest nearby destinations first, then expand globally
2. For "travel tips": Provide location-specific advice about their current area
3. For flight recommendations: Compare options from their current location
4. For itinerary planning: Start from their location as the departure point

If you don't know the user's name yet, politely ask for it in a friendly way. Always maintain enthusiasm about travel and help create memorable trip experiences!`
            } else {
                // Location not available - ask user to confirm location first
                systemPrompt = userName
                    ? `You are a helpful AI travel assistant. The user's name is ${userName}.

LOCATION DETECTION STATUS: ${locationStatus}

If the user asks "where am I from", "where am I", or requests location-specific recommendations:
1. Explain that the app is detecting their location
2. Ask them to allow location permission when prompted
3. Alternatively, offer to manually set their home location for better recommendations

Help them plan trips and answer travel questions using their name naturally in conversation. Once their location is confirmed, you'll be able to provide better personalized recommendations for nearby destinations and travel options.`
                    : `You are a helpful AI travel assistant.

LOCATION DETECTION STATUS: ${locationStatus}

If the user asks about their location or requests location-specific recommendations:
1. Explain that the app is detecting their location
2. Ask them to allow location permission when prompted
3. Alternatively, offer to manually set their location for better recommendations

Help users plan their trips and answer travel questions. Once their location is confirmed, you'll be able to provide better personalized recommendations for nearby destinations and travel options.`
            }
            
            chatMessages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: message
                }
            ]
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Either message or messages array is required' 
            })
        }

        // Save user message to chat history with location context
        if (userId && message) {
            try {
                const historyData = {
                    user_id: userId,
                    role: 'user',
                    message: message,
                    content: message
                };
                
                // Add context data including location information
                const contextData = {
                    locationStatus: locationStatus,
                    hasLocationData: !!locationContext,
                    userName: userName || null
                };
                
                if (sessionId) {
                    historyData.session_id = sessionId;
                }
                
                if (Object.keys(contextData).length > 0) {
                    historyData.context_data = contextData;
                }
                
                const { data, error } = await getSupabase()
                    .from('chat_history')
                    .insert([historyData])
                    .select();
                
                if (error) {
                    console.error('Error saving user message to history:', error?.message, error?.details);
                } else {
                    console.log('✓ User message saved:', { userId, role: 'user', id: data?.[0]?.id, location: locationStatus });
                }
            } catch (error) {
                console.error('Exception saving user message:', error?.message)
            }
        }

        const chatCompletion = await getGroq().chat.completions.create({
            messages: chatMessages,
            model,
            temperature: 0.7,
            max_tokens: 1024,
        })

        const assistantMessage = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

        // Save assistant message to chat history with location context
        if (userId) {
            try {
                const historyData = {
                    user_id: userId,
                    role: 'assistant',
                    message: assistantMessage,
                    content: assistantMessage
                };
                
                // Add context data including location information
                const contextData = {
                    locationStatus: locationStatus,
                    hasLocationData: !!locationContext,
                    nearbyContextIncluded: !!nearbyContext,
                    userName: userName || null,
                    model: model
                };
                
                if (sessionId) {
                    historyData.session_id = sessionId;
                }
                
                if (Object.keys(contextData).length > 0) {
                    historyData.context_data = contextData;
                }
                
                const { data, error } = await getSupabase()
                    .from('chat_history')
                    .insert([historyData])
                    .select();
                
                if (error) {
                    console.error('Error saving assistant message to history:', error?.message, error?.details);
                } else {
                    console.log('✓ Assistant message saved:', { userId, role: 'assistant', id: data?.[0]?.id, location: locationStatus });
                }
            } catch (error) {
                console.error('Exception saving assistant message:', error?.message)
            }
        }

        res.json({
            success: true,
            message: assistantMessage,
            data: {
                message: chatCompletion.choices[0]?.message,
                usage: chatCompletion.usage,
                locationStatus: locationStatus
            }
        })
    } catch (error) {
        console.error('Chat error:', error?.message)
        res.json({ 
            success: true, 
            message: 'Could not process chat',
            data: { message: 'Error processing request' }
        })
    }
})

export default router
