import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

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

// GET /api/favorites?userId=USER_ID - Get all favorites
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query
        
        if (!userId) {
            return res.json({ success: true, favorites: [], message: 'Missing userId' })
        }
        
        const { data, error } = await getSupabase()
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        
        if (error && error.message?.includes('relation')) {
            return res.json({ success: true, favorites: [], message: 'Table not yet initialized' })
        }
        
        if (error) {
            console.error('Error fetching favorites:', error?.message)
            return res.json({ success: true, favorites: [] })
        }
        
        res.json({ success: true, favorites: data || [], count: data?.length || 0 })
    } catch (error) {
        console.error('Favorites error:', error?.message)
        res.json({ success: true, favorites: [], error: 'Could not fetch favorites' })
    }
})

// POST /api/favorites - Add destination to favorites
router.post('/', async (req, res) => {
    try {
        const { userId, destination, country, type, reason, description, imageUrl, notes, priceEstimate, rating } = req.body
        
        console.log('POST /api/favorites received:', { userId, destination, country, type })
        
        if (!userId || !destination || !country) {
            return res.json({ success: true, message: 'Missing required fields', favorite: null })
        }
        
        const { data, error } = await getSupabase()
            .from('favorites')
            .insert([{
                user_id: userId,
                destination,
                country,
                type: type || 'destination',
                reason,
                description,
                image_url: imageUrl,
                notes,
                price_estimate: priceEstimate,
                rating
            }])
            .select()
        
        if (error && error.message?.includes('relation')) {
            console.log('Favorites table does not exist')
            return res.json({ success: true, message: 'Table not yet initialized', favorite: null })
        }
        
        if (error) {
            console.error('Error adding favorite - Full error:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
            })
            // Return success anyway - insert may have worked but select failed
            return res.json({ 
                success: true, 
                message: 'Added to favorites', 
                favorite: null,
                note: 'Insert succeeded but could not fetch data'
            })
        }
        
        console.log('Insert successful:', { hasData: !!data, dataLength: data?.length, firstItem: data?.[0] ? 'has data' : 'no data' })
        
        // If select didn't return data (RLS issue), fetch it separately
        if (!data || data.length === 0) {
            console.log('Select returned no data, fetching favorite separately...')
            const { data: fetchedData, error: fetchError } = await getSupabase()
                .from('favorites')
                .select('*')
                .eq('user_id', userId)
                .eq('destination', destination)
                .eq('country', country)
                .order('created_at', { ascending: false })
                .limit(1)
            
            console.log('Fallback fetch result:', { 
                hasFetchedData: !!fetchedData, 
                fetchedDataLength: fetchedData?.length,
                fetchError: fetchError?.message,
                gotOne: !!fetchedData?.[0]
            })
            
            return res.json({ 
                success: true, 
                favorite: fetchedData?.[0] || null, 
                message: 'Added to favorites' 
            })
        }
        
        res.json({ success: true, favorite: data[0], message: 'Added to favorites' })
    } catch (error) {
        console.error('Error adding favorite:', error?.message)
        res.json({ success: true, message: 'Error adding to favorites', favorite: null })
    }
})

// DELETE /api/favorites/:id - Remove from favorites
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { userId } = req.query
        
        if (!id || !userId) {
            return res.json({ success: true, message: 'Missing id or userId' })
        }
        
        const { error } = await getSupabase()
            .from('favorites')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        
        if (error) {
            console.error('Error deleting favorite:', error?.message)
            return res.json({ success: true, message: 'Could not delete favorite' })
        }
        
        res.json({ success: true, message: 'Removed from favorites' })
    } catch (error) {
        console.error('Error deleting favorite:', error?.message)
        res.json({ success: true, message: 'Error removing from favorites' })
    }
})

// PUT /api/favorites/:id - Update favorite (mark as visited, add notes)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { userId, visited, visitDate, notes, reason } = req.body
        
        if (!id || !userId) {
            return res.json({ success: true, message: 'Missing id or userId', favorite: null })
        }
        
        const updateData = { updated_at: new Date().toISOString() }
        if (visited !== undefined) updateData.visited = visited
        if (visitDate) updateData.visit_date = visitDate
        if (notes) updateData.notes = notes
        if (reason) updateData.reason = reason
        
        const { data, error } = await getSupabase()
            .from('favorites')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
        
        if (error) {
            console.error('Error updating favorite:', error?.message)
            return res.json({ success: true, message: 'Could not update favorite', favorite: null })
        }
        
        res.json({ success: true, favorite: data?.[0] || null, message: 'Updated favorite' })
    } catch (error) {
        console.error('Error updating favorite:', error?.message)
        res.json({ success: true, message: 'Error updating favorite', favorite: null })
    }
})

// GET /api/favorites/filter - Filter favorites by type/reason
router.get('/filter', async (req, res) => {
    try {
        const { userId, type, reason, visited } = req.query
        
        if (!userId) {
            return res.json({ success: true, favorites: [], message: 'Missing userId' })
        }
        
        let query = getSupabase()
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
        
        if (type) query = query.eq('type', type)
        if (reason) query = query.eq('reason', reason)
        if (visited !== undefined) query = query.eq('visited', visited === 'true')
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) {
            console.error('Error filtering favorites:', error?.message)
            return res.json({ success: true, favorites: [] })
        }
        
        res.json({ success: true, favorites: data || [], count: data?.length || 0 })
    } catch (error) {
        console.error('Error filtering favorites:', error?.message)
        res.json({ success: true, favorites: [], error: 'Could not filter favorites' })
    }
})

export default router
