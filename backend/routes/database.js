import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Initialize Supabase client lazily to ensure env vars are loaded
let supabase = null
let supabaseError = null

function getSupabase() {
    if (supabaseError) {
        throw supabaseError
    }
    
    if (!supabase) {
        try {
            const url = process.env.SUPABASE_URL
            const key = process.env.SUPABASE_ANON_KEY
            
            if (!url || !key) {
                supabaseError = new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
                throw supabaseError
            }
            
            supabase = createClient(url, key)
        } catch (error) {
            supabaseError = error
            throw error
        }
    }
    return supabase
}

// Health check for database service
router.get('/health', async (req, res) => {
    try {
        const client = getSupabase()
        const { data, error } = await client.from('user_profiles').select('count', { count: 'exact', head: true })
        
        if (error && error.code !== 'PGRST116') {
            throw error
        }
        
        res.json({ 
            success: true, 
            status: 'Database connected',
            envVars: {
                SUPABASE_URL: !!process.env.SUPABASE_URL,
                SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Database service not configured - set SUPABASE_URL and SUPABASE_ANON_KEY'
        })
    }
})

// GET /api/database/trips?userId=user_123
router.get('/trips', async (req, res) => {
    try {
        const { userId } = req.query
        
        const { data, error } = await getSupabase()
            .from('saved_trips')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        res.json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// POST /api/database/trips
router.post('/trips', async (req, res) => {
    try {
        const { userId, tripData } = req.body
        
        const { data, error } = await getSupabase()
            .from('saved_trips')
            .insert([{ user_id: userId, ...tripData }])
            .select()
        
        if (error) throw error
        res.json({ success: true, data: data[0] })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// GET /api/database/user-preferences?userId=user_123
router.get('/user-preferences', async (req, res) => {
    try {
        const { userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId parameter required',
                data: null 
            })
        }
        
        const { data, error } = await getSupabase()
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single()
        
        // PGRST116 = no rows found (not an error, just no data yet)
        if (error && error.code !== 'PGRST116') {
            console.error('Database error:', error)
            // Table may not exist yet - return empty instead of error
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
            throw error
        }
        
        res.json({ success: true, data: data || null })
    } catch (error) {
        console.error('Get preferences error:', error)
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to fetch preferences',
            data: null 
        })
    }
})

// POST /api/database/user-preferences
router.post('/user-preferences', async (req, res) => {
    try {
        const { userId, preferences } = req.body
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId required' 
            })
        }
        
        // Upsert user preferences with correct column names
        const updateData = { 
            user_id: userId,
            updated_at: new Date().toISOString()
        }
        
        // Map frontend field names to database schema field names
        if (preferences?.locationCity !== undefined) updateData.current_location = preferences.locationCity
        if (preferences?.locationCountry !== undefined) updateData.current_country = preferences.locationCountry
        if (preferences?.locationLat !== undefined) updateData.latitude = preferences.locationLat
        if (preferences?.locationLon !== undefined) updateData.longitude = preferences.locationLon
        if (preferences?.travelStyle !== undefined) updateData.preferred_travel_style = preferences.travelStyle
        if (preferences?.budget !== undefined) updateData.preferred_budget = preferences.budget
        if (preferences?.activities !== undefined) updateData.preferred_activities = preferences.activities
        if (preferences?.dietaryRestrictions !== undefined) updateData.dietary_restrictions = preferences.dietaryRestrictions
        if (preferences?.travelPace !== undefined) updateData.travel_pace = preferences.travelPace
        if (preferences?.groupType !== undefined) updateData.group_type = preferences.groupType
        
        const { data, error } = await getSupabase()
            .from('user_preferences')
            .upsert([updateData], { onConflict: 'user_id' })
            .select()
        
        if (error) {
            console.error('Upsert error:', error)
            // If table doesn't exist, return success anyway
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
            throw error
        }
        
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('Save preferences error:', error)
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to save preferences' 
        })
    }
})

// DELETE /api/database/trips/:id?userId=user_123
router.delete('/trips/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { userId } = req.query
        
        const { error } = await getSupabase()
            .from('saved_trips')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        
        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// DELETE /api/database/user-preferences?userId=user_123
router.delete('/user-preferences', async (req, res) => {
    try {
        const { userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId parameter required' 
            })
        }
        
        const { error } = await getSupabase()
            .from('user_preferences')
            .delete()
            .eq('user_id', userId)
        
        if (error) {
            console.error('Delete error:', error)
            // If table doesn't exist, return success anyway
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                return res.json({ 
                    success: true,
                    message: 'Table not yet initialized'
                })
            }
            throw error
        }
        
        res.json({ success: true })
    } catch (error) {
        console.error('Delete preferences error:', error)
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to delete preferences' 
        })
    }
})

// GET /api/database/bookmarks?userId=user_123
router.get('/bookmarks', async (req, res) => {
    try {
        const { userId, tripId } = req.query
        
        let query = getSupabase()
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
        
        if (tripId) {
            query = query.eq('trip_id', tripId)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) throw error
        res.json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// POST /api/database/bookmarks
router.post('/bookmarks', async (req, res) => {
    try {
        const { userId, itemType, itemData, tripId, notes } = req.body
        
        const { data, error } = await getSupabase()
            .from('bookmarks')
            .insert([{
                user_id: userId,
                trip_id: tripId,
                item_type: itemType,
                item_data: itemData,
                notes
            }])
            .select()
        
        if (error) throw error
        res.json({ success: true, data: data[0] })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// DELETE /api/database/bookmarks/:id
router.delete('/bookmarks/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { userId } = req.query
        
        const { error } = await getSupabase()
            .from('bookmarks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        
        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// GET /api/database/chat-history?userId=user_123&sessionId=session_123
router.get('/chat-history', async (req, res) => {
    try {
        const { userId, sessionId, limit = 50 } = req.query
        
        let query = getSupabase()
            .from('chat_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(parseInt(limit))
        
        if (sessionId) {
            query = query.eq('session_id', sessionId)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        res.json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// POST /api/database/chat-history
router.post('/chat-history', async (req, res) => {
    try {
        const { userId, role, content, sessionId } = req.body
        
        const { data, error } = await getSupabase()
            .from('chat_history')
            .insert([{
                user_id: userId,
                role,
                content,
                session_id: sessionId
            }])
            .select()
        
        if (error) throw error
        res.json({ success: true, data: data[0] })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// DELETE /api/database/chat-history?userId=user_123&sessionId=session_123
router.delete('/chat-history', async (req, res) => {
    try {
        const { userId, sessionId } = req.query
        
        let query = getSupabase()
            .from('chat_history')
            .delete()
            .eq('user_id', userId)
        
        if (sessionId) {
            query = query.eq('session_id', sessionId)
        }
        
        const { error } = await query
        
        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// GET /api/database/search-history?userId=user_123&type=flight
router.get('/search-history', async (req, res) => {
    try {
        const { userId, type, limit = 20 } = req.query
        
        let query = getSupabase()
            .from('search_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit))
        
        if (type) {
            query = query.eq('search_type', type)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        res.json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// POST /api/database/search-history
router.post('/search-history', async (req, res) => {
    try {
        const { userId, searchType, searchQuery, resultsCount } = req.body
        
        const { data, error } = await getSupabase()
            .from('search_history')
            .insert([{
                user_id: userId,
                search_type: searchType,
                search_query: searchQuery,
                results_count: resultsCount
            }])
            .select()
        
        if (error) throw error
        res.json({ success: true, data: data[0] })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
