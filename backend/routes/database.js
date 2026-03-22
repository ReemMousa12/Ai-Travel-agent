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
            // If table doesn't exist, that's still OK - just means schema not deployed
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    status: 'Waiting for database schema',
                    envVars: {
                        SUPABASE_URL: !!process.env.SUPABASE_URL,
                        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
                    },
                    message: 'Database connected but schema not yet deployed'
                })
            }
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
        console.error('Database health check error:', error?.message)
        res.json({
            success: true,
            status: 'Database not available',
            error: error?.message,
            envVars: {
                SUPABASE_URL: !!process.env.SUPABASE_URL ? '✅' : '❌',
                SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY ? '✅' : '❌'
            },
            message: 'Set SUPABASE_URL and SUPABASE_ANON_KEY if not configured'
        })
    }
})

// POST /api/database/create-profile - Create user profile on signup
router.post('/create-profile', async (req, res) => {
    try {
        const { userId, email, name } = req.body
        
        if (!userId) {
            return res.json({ 
                success: false, 
                data: null,
                message: 'userId required'
            })
        }
        
        console.log('👤 Creating user profile:', { userId, email, name })
        
        const { data, error } = await getSupabase()
            .from('user_profiles')
            .insert([{
                user_id: userId,
                email: email || null,
                name: name || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
        
        if (error) {
            console.error('❌ Create profile error:', error?.message)
            // If table doesn't exist, return success anyway
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
            // If profile already exists (duplicate), that's OK
            if (error.message?.includes('duplicate') || error.code === '23505') {
                console.log('ℹ️ Profile already exists for user:', userId)
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Profile already exists'
                })
            }
            throw error
        }
        
        console.log('✅ User profile created:', { userId })
        res.json({ success: true, data: data?.[0] || null, message: 'Profile created' })
    } catch (error) {
        console.error('Save profile error:', error?.message)
        res.json({ success: false, data: null, message: 'Could not create profile' })
    }
})

// GET /api/database/trips?userId=user_123
router.get('/trips', async (req, res) => {
    try {
        const { userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required', data: [] })
        }
        
        const { data, error } = await getSupabase()
            .from('saved_trips')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        
        if (error) {
            // If table doesn't exist, return empty array instead of error
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: [], message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true, data: data || [] })
    } catch (error) {
        console.error('Get trips error:', error?.message)
        res.json({ success: true, data: [], message: 'Could not fetch trips' })
    }
})

// POST /api/database/trips
router.post('/trips', async (req, res) => {
    try {
        const { userId, tripData } = req.body
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' })
        }
        
        const { data, error } = await getSupabase()
            .from('saved_trips')
            .insert([{ user_id: userId, ...tripData }])
            .select()
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: null, message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('Save trip error:', error?.message)
        res.json({ success: true, data: null, message: 'Could not save trip' })
    }
})

// GET /api/database/user-preferences?userId=user_123
router.get('/user-preferences', async (req, res) => {
    try {
        const { userId } = req.query
        
        if (!userId) {
            return res.json({ 
                success: true, 
                data: null,
                message: 'userId parameter required'
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
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
            // Log other errors but don't crash
            console.error('Other error:', error.message)
            return res.json({ 
                success: true, 
                data: null,
                message: 'Could not fetch preferences'
            })
        }
        
        // Map database field names back to frontend field names
        if (data) {
            data.locationCity = data.current_location
            data.locationCountry = data.current_country
            data.locationLat = data.latitude
            data.locationLon = data.longitude
            console.log('✅ Returning mapped preferences:', data)
        }
        
        res.json({ success: true, data: data || null })
    } catch (error) {
        console.error('Get preferences error:', error?.message)
        res.json({ 
            success: true, 
            data: null,
            message: 'Could not fetch preferences'
        })
    }
})

// POST /api/database/user-preferences
router.post('/user-preferences', async (req, res) => {
    try {
        const { userId, preferences } = req.body
        
        if (!userId) {
            return res.json({ 
                success: true, 
                data: null,
                message: 'userId required'
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
        
        // Log what we're about to save
        console.log('💾 Saving user preferences:', { userId, updateData });
        
        const { data, error } = await getSupabase()
            .from('user_preferences')
            .upsert([updateData], { onConflict: 'user_id' })
            .select()
        
        if (error) {
            console.error('❌ Upsert error for user', userId, ':', error?.message, 'Code:', error?.code);
            // If table doesn't exist, return success anyway
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                console.warn('⚠️ Table not yet initialized');
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
            // Log more details and return with error info
            console.error('📋 Full error:', error);
            return res.json({ 
                success: false,
                data: null,
                message: 'Could not save preferences: ' + error.message,
                error: error?.message
            })
        }
        
        console.log('✅ User preferences saved successfully:', { userId, current_location: updateData.current_location, current_country: updateData.current_country });
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('❌ Unexpected error in save preferences:', error?.message);
        res.json({ 
            success: false,
            data: null,
            message: 'Could not save preferences: ' + error?.message,
            error: error?.message
        })
    }
})

// DELETE /api/database/trips/:id?userId=user_123
router.delete('/trips/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { userId } = req.query
        
        if (!id || !userId) {
            return res.status(400).json({ success: false, error: 'id and userId required' })
        }
        
        const { error } = await getSupabase()
            .from('saved_trips')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true })
    } catch (error) {
        console.error('Delete trip error:', error?.message)
        res.json({ success: true })
    }
})

// DELETE /api/database/user-preferences?userId=user_123
router.delete('/user-preferences', async (req, res) => {
    try {
        const { userId } = req.query
        
        if (!userId) {
            return res.json({ 
                success: true,
                message: 'userId parameter required'
            })
        }
        
        const { error } = await getSupabase()
            .from('user_preferences')
            .delete()
            .eq('user_id', userId)
        
        if (error) {
            console.error('Delete error:', error?.message)
            // If table doesn't exist, return success anyway
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ 
                    success: true,
                    message: 'Table not yet initialized'
                })
            }
            // Return success even on other errors
            return res.json({ 
                success: true,
                message: 'Could not delete preferences'
            })
        }
        
        res.json({ success: true })
    } catch (error) {
        console.error('Delete preferences error:', error?.message)
        res.json({ 
            success: true,
            message: 'Could not delete preferences'
        })
    }
})

// GET /api/database/bookmarks?userId=user_123
router.get('/bookmarks', async (req, res) => {
    try {
        const { userId, tripId } = req.query
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required', data: [] })
        }
        
        let query = getSupabase()
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
        
        if (tripId) {
            query = query.eq('trip_id', tripId)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: [], message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true, data: data || [] })
    } catch (error) {
        console.error('Get bookmarks error:', error?.message)
        res.json({ success: true, data: [] })
    }
})

// POST /api/database/bookmarks
router.post('/bookmarks', async (req, res) => {
    try {
        const { userId, itemType, itemData, tripId, notes } = req.body
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' })
        }
        
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
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: null, message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('Save bookmark error:', error?.message)
        res.json({ success: true, data: null })
    }
})

// DELETE /api/database/bookmarks/:id
router.delete('/bookmarks/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { userId } = req.query
        
        if (!id || !userId) {
            return res.status(400).json({ success: false, error: 'id and userId required' })
        }
        
        const { error } = await getSupabase()
            .from('bookmarks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true })
    } catch (error) {
        console.error('Delete bookmark error:', error?.message)
        res.json({ success: true })
    }
})

// GET /api/database/chat-history?userId=user_123&sessionId=session_123
router.get('/chat-history', async (req, res) => {
    try {
        const { userId, sessionId, limit = 50 } = req.query
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required', data: [] })
        }
        
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
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: [], message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true, data: data || [] })
    } catch (error) {
        console.error('Get chat history error:', error?.message)
        res.json({ success: true, data: [] })
    }
})

// POST /api/database/chat-history
router.post('/chat-history', async (req, res) => {
    try {
        const { userId, role, content, sessionId } = req.body
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' })
        }
        
        // Build data object with only existing fields
        const historyData = {
            user_id: userId,
            role,
            message: content // Save to 'message' field which should exist
        };
        
        // Add optional fields if table has them
        if (sessionId) {
            historyData.session_id = sessionId;
        }
        
        const { data, error } = await getSupabase()
            .from('chat_history')
            .insert([historyData])
            .select()
        
        if (error) {
            console.error('Chat history insert error:', { message: error?.message, code: error?.code, details: error?.details })
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: null, message: 'Table not yet initialized' })
            }
            throw error
        }
        
        console.log('✓ Chat message saved:', { userId, role, id: data?.[0]?.id })
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('Save chat history error:', error?.message)
        res.json({ success: true, data: null, message: error?.message })
    }
})

// DELETE /api/database/chat-history?userId=user_123&sessionId=session_123
router.delete('/chat-history', async (req, res) => {
    try {
        const { userId, sessionId } = req.query
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' })
        }
        
        let query = getSupabase()
            .from('chat_history')
            .delete()
            .eq('user_id', userId)
        
        if (sessionId) {
            query = query.eq('session_id', sessionId)
        }
        
        const { error } = await query
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true })
    } catch (error) {
        console.error('Delete chat history error:', error?.message)
        res.json({ success: true })
    }
})

// GET /api/database/search-history?userId=user_123&type=flight
router.get('/search-history', async (req, res) => {
    try {
        const { userId, type, limit = 20 } = req.query
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required', data: [] })
        }
        
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
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: [], message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true, data: data || [] })
    } catch (error) {
        console.error('Get search history error:', error?.message)
        res.json({ success: true, data: [] })
    }
})

// POST /api/database/search-history
router.post('/search-history', async (req, res) => {
    try {
        const { userId, searchType, searchQuery, resultsCount } = req.body
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' })
        }
        
        const { data, error } = await getSupabase()
            .from('search_history')
            .insert([{
                user_id: userId,
                search_type: searchType,
                search_query: searchQuery,
                results_count: resultsCount
            }])
            .select()
        
        if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ success: true, data: null, message: 'Table not yet initialized' })
            }
            throw error
        }
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('Save search history error:', error?.message)
        res.json({ success: true, data: null })
    }
})

// GET /api/database/user-profile?userId=user_123
router.get('/user-profile', async (req, res) => {
    try {
        const { userId } = req.query
        
        if (!userId) {
            return res.json({ 
                success: true, 
                data: null,
                message: 'userId parameter required'
            })
        }
        
        const { data, error } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()
        
        // PGRST116 = no rows found (not an error, just no data yet)
        if (error && error.code !== 'PGRST116') {
            console.error('Get user profile error:', error?.message)
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
        }
        
        res.json({ success: true, data: data || null })
    } catch (error) {
        console.error('Get user profile error:', error?.message)
        res.json({ success: true, data: null })
    }
})

// POST /api/database/user-profile - Update user profile
router.post('/user-profile', async (req, res) => {
    try {
        const { userId, name, bio, homeCity, homeCountry, profileImage } = req.body
        
        if (!userId) {
            return res.json({ 
                success: false, 
                data: null,
                message: 'userId required'
            })
        }
        
        const updateData = {
            user_id: userId,
            updated_at: new Date().toISOString()
        }
        
        if (name !== undefined) updateData.name = name
        if (bio !== undefined) updateData.bio = bio
        if (homeCity !== undefined) updateData.home_city = homeCity
        if (homeCountry !== undefined) updateData.home_country = homeCountry
        if (profileImage !== undefined) updateData.profile_image = profileImage
        
        console.log('👤 Updating user profile:', { userId, updateData })
        
        const { data, error } = await getSupabase()
            .from('user_profiles')
            .upsert([updateData], { onConflict: 'user_id' })
            .select()
        
        if (error) {
            console.error('❌ Update profile error:', error?.message)
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
            return res.json({ 
                success: false,
                data: null,
                message: 'Could not update profile: ' + error.message
            })
        }
        
        console.log('✅ User profile updated:', { userId })
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('Update profile error:', error?.message)
        res.json({ success: false, data: null, message: 'Could not update profile' })
    }
})

// POST /api/database/user-location - Save detected location to user_profiles
router.post('/user-location', async (req, res) => {
    try {
        const { userId, locationCity, locationCountry, latitude, longitude } = req.body
        
        if (!userId) {
            return res.json({ 
                success: false, 
                data: null,
                message: 'userId required'
            })
        }
        
        console.log('📍 Saving detected location to user profile:', { userId, locationCity, locationCountry })
        
        const updateData = {
            user_id: userId,
            current_location: locationCity,
            current_country: locationCountry,
            latitude: latitude,
            longitude: longitude,
            updated_at: new Date().toISOString()
        }
        
        const { data, error } = await getSupabase()
            .from('user_profiles')
            .upsert([updateData], { onConflict: 'user_id' })
            .select()
        
        if (error) {
            console.error('❌ Save location error:', error?.message)
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                return res.json({ 
                    success: true, 
                    data: null,
                    message: 'Table not yet initialized'
                })
            }
            return res.json({ 
                success: false,
                data: null,
                message: 'Could not save location: ' + error.message
            })
        }
        
        console.log('✅ Location saved to profile:', { userId, locationCity })
        res.json({ success: true, data: data?.[0] || null })
    } catch (error) {
        console.error('Save location error:', error?.message)
        res.json({ success: false, data: null, message: 'Could not save location' })
    }
})

export default router
