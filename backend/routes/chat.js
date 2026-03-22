import express from 'express'
import { Groq } from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

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

// Initialize Groq client lazily to ensure env vars are loaded
let groq = null
let groqError = null

function getGroq() {
    if (groqError) {
        return null  // Return null instead of throwing
    }
    
    if (!groq) {
        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            groqError = new Error('GROQ_API_KEY not configured')
            console.warn('⚠️ GROQ_API_KEY not set - Chat service unavailable')
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

// Initialize Supabase client lazily
let supabase = null
let supabaseError = null

function getSupabase() {
    if (supabaseError) {
        return null  // Return null instead of throwing
    }
    
    if (!supabase) {
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_ANON_KEY
        
        if (!url || !key) {
            supabaseError = new Error('Missing Supabase credentials')
            console.warn('⚠️ Supabase credentials not configured - Database service unavailable')
            return null
        }
        
        try {
            supabase = createClient(url, key)
        } catch (error) {
            supabaseError = error
            console.error('❌ Failed to initialize Supabase:', error?.message)
            return null
        }
    }
    return supabase
}

// POST /api/chat
router.post('/', asyncHandler(async (req, res) => {
    const { message, userId, messages, model = 'llama-3.3-70b-versatile', sessionId, userName: providedUserName } = req.body

    // Fetch user location preferences
    let locationContext = ''
    let userName = providedUserName || '' // Use provided userName from request
    if (userId) {
        try {
            const supabaseClient = getSupabase()
            if (!supabaseClient) {
                console.warn('⚠️ Supabase not available - skipping preferences')
            } else {
                const { data } = await supabaseClient
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .single()
                
                if (data) {
                    if (data.location_city) {
                        locationContext = `\n\nUser's current location: ${data.location_city}, ${data.location_country}`
                    }
                    // Only override with database name if no name was provided in request
                    if (!userName && data.user_name) {
                        userName = data.user_name
                    }
                }
                
                // Save the userName to database if provided and not already saved
                if (providedUserName && (!data || !data.user_name)) {
                    await supabaseClient
                        .from('user_preferences')
                        .upsert([{ 
                            user_id: userId, 
                            user_name: providedUserName,
                            updated_at: new Date().toISOString()
                        }], { onConflict: 'user_id' })
                }
            }
        } catch (error) {
            // Ignore error if no preferences found
            console.log('No user preferences found or database unavailable')
        }
    }

    // Support both formats: single message or messages array
    let chatMessages
    if (messages && Array.isArray(messages)) {
        chatMessages = messages
    } else if (message) {
        // Convert single message to messages array
        const systemPrompt = userName 
            ? `You are a helpful AI travel assistant. The user's name is ${userName}. Help them plan trips, answer travel questions, and provide personalized recommendations. Use their name naturally in conversation.${locationContext}`
            : `You are a helpful AI travel assistant. Help users plan their trips, answer travel questions, and provide recommendations. If you don't know the user's name yet, politely ask for it in a friendly way during the conversation.${locationContext}`
        
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
            const supabaseClient = getSupabase()
            if (supabaseClient) {
                await supabaseClient
                    .from('chat_history')
                    .insert([{
                        user_id: userId,
                        role: 'user',
                        content: message,
                        session_id: sessionId || new Date().toISOString().split('T')[0]
                    }])
            }
        } catch (error) {
            console.error('Error saving user message to history:', error)
        }
    }

    // Check if Groq is available before attempting to use it
    const groqClient = getGroq()
    if (!groqClient) {
        console.error('❌ Groq client not available - missing GROQ_API_KEY')
        return res.status(503).json({
            success: false,
            error: 'Chat service unavailable',
            message: 'GROQ_API_KEY not configured on server',
            statusCode: 503
        })
    }

    const chatCompletion = await groqClient.chat.completions.create({
        messages: chatMessages,
        model,
        temperature: 0.7,
        max_tokens: 1024,
    })

    const assistantMessage = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Save assistant message to chat history
    if (userId) {
        try {
            const supabaseClient = getSupabase()
            if (supabaseClient) {
                await supabaseClient
                    .from('chat_history')
                    .insert([{
                        user_id: userId,
                        role: 'assistant',
                        content: assistantMessage,
                        session_id: sessionId || new Date().toISOString().split('T')[0]
                    }])
            }
        } catch (error) {
            console.error('Error saving assistant message to history:', error)
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
}))

export default router
