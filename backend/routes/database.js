import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Initialize Supabase client lazily to ensure env vars are loaded
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
        
        const { data, error } = await getSupabase()
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single()
        
        if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
        res.json({ success: true, data: data || null })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// POST /api/database/user-preferences
router.post('/user-preferences', async (req, res) => {
    try {
        const { userId, preferences } = req.body
        
        // Upsert user preferences
        const updateData = { 
            user_id: userId,
            updated_at: new Date().toISOString()
        }
        
        // Add optional fields if provided
        if (preferences.userName !== undefined) updateData.user_name = preferences.userName
        if (preferences.locationCity !== undefined) updateData.location_city = preferences.locationCity
        if (preferences.locationCountry !== undefined) updateData.location_country = preferences.locationCountry
        if (preferences.locationLat !== undefined) updateData.location_lat = preferences.locationLat
        if (preferences.locationLon !== undefined) updateData.location_lon = preferences.locationLon
        if (preferences.locationCity !== undefined) updateData.last_weather_update = new Date().toISOString()
        
        const { data, error } = await getSupabase()
            .from('user_preferences')
            .upsert([updateData], { onConflict: 'user_id' })
            .select()
        
        if (error) throw error
        res.json({ success: true, data: data[0] })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
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
        
        const { error } = await getSupabase()
            .from('user_preferences')
            .delete()
            .eq('user_id', userId)
        
        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
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
