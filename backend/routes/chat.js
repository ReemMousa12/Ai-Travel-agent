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

        // Fetch user location preferences
        let locationContext = ''
        let userName = providedUserName || '' // Use provided userName from request
        if (userId) {
            try {
                const { data } = await getSupabase()
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
                console.log('No user preferences found')
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
                await getSupabase()
                    .from('chat_history')
                    .insert([{
                        user_id: userId,
                        role: 'user',
                        content: message,
                        session_id: sessionId || new Date().toISOString().split('T')[0]
                    }])
            } catch (error) {
                console.error('Error saving user message to history:', error)
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
                await getSupabase()
                    .from('chat_history')
                    .insert([{
                        user_id: userId,
                        role: 'assistant',
                        content: assistantMessage,
                        session_id: sessionId || new Date().toISOString().split('T')[0]
                    }])
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
