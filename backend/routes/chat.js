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
        if (userId) {
            try {
                const { data } = await getSupabase()
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .single()
                
                if (data) {
                    // Check for current_location and current_country (snake_case in database)
                    if (data.current_location && data.current_country) {
                        let locDetails = `User's current location: ${data.current_location}, ${data.current_country}`;
                        if (data.latitude && data.longitude) {
                            locDetails += ` (Coordinates: ${data.latitude}, ${data.longitude})`;
                        }
                        locationContext = `\n\n${locDetails}. Use this location to provide personalized travel recommendations, nearby attractions, weather, and local information.`;
                        console.log('✅ Location context loaded:', locDetails);
                        
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
                    if (!userName && data.user_name) {
                        userName = data.user_name
                    }
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
                // Ignore error if no preferences found
                console.log('ℹ️ No user preferences found, location detection skipped')
            }
        }

        // Support both formats: single message or messages array
        let chatMessages
        if (messages && Array.isArray(messages)) {
            chatMessages = messages
        } else if (message) {
            // Convert single message to messages array
            const systemPrompt = userName 
                ? `You are a helpful AI travel assistant. The user's name is ${userName}.${locationContext}${nearbyContext}

Help them plan trips, answer travel questions, and provide personalized recommendations. Use their name naturally in conversation. When asked about their location or nearby countries, refer to the context provided above. Provide relevant information about their area including attractions, weather insights, and travel opportunities. When suggesting nearby countries, include details about distance, travel time, and best season to visit.`
                : `You are a helpful AI travel assistant.${locationContext}${nearbyContext}

Help users plan their trips, answer travel questions, and provide recommendations. When asked about their location or nearby countries, refer to the context provided above. Include details about distance, travel time, and best season to visit. If you don't know the user's name yet, politely ask for it in a friendly way during the conversation.`
            
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

        // Save user message to chat history
        if (userId && message) {
            try {
                const historyData = {
                    user_id: userId,
                    role: 'user',
                    message: message
                };
                // Try to add optional fields for newer schema
                if (sessionId) {
                    historyData.session_id = sessionId;
                }
                
                const { data, error } = await getSupabase()
                    .from('chat_history')
                    .insert([historyData])
                    .select();
                
                if (error) {
                    console.error('Error saving user message to history:', error?.message, error?.details);
                } else {
                    console.log('✓ User message saved:', { userId, role: 'user', id: data?.[0]?.id });
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

        // Save assistant message to chat history
        if (userId) {
            try {
                const historyData = {
                    user_id: userId,
                    role: 'assistant',
                    message: assistantMessage
                };
                // Try to add optional fields for newer schema
                if (sessionId) {
                    historyData.session_id = sessionId;
                }
                
                const { data, error } = await getSupabase()
                    .from('chat_history')
                    .insert([historyData])
                    .select();
                
                if (error) {
                    console.error('Error saving assistant message to history:', error?.message, error?.details);
                } else {
                    console.log('✓ Assistant message saved:', { userId, role: 'assistant', id: data?.[0]?.id });
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
                usage: chatCompletion.usage
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
