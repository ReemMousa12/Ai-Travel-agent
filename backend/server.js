import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables FIRST before importing routes
dotenv.config({ path: path.join(__dirname, '.env') })

// Handle environment variables - Vercel uses VITE prefix for some, standard for others
// Set standard names from VITE prefixed versions if available (Vercel)
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL
}
if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
}


// Verify critical environment variables exist
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY']
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v])

if (missingEnvVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingEnvVars.join(', ')}`)
    console.warn('ℹ️ Set these in Vercel Dashboard → Project Settings → Environment Variables:')
    console.warn('   - VITE_SUPABASE_URL')
    console.warn('   - VITE_SUPABASE_ANON_KEY')
    console.warn('   - GROQ_API_KEY (no VITE prefix)')
}

import chatRoutes from './routes/chat.js'
import travelRoutes from './routes/travel.js'
import databaseRoutes from './routes/database.js'
import locationRoutes from './routes/location.js'
import favoritesRoutes from './routes/favorites.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware - CORS Configuration for Vercel and local development
// Handle CORS with explicit headers for maximum compatibility
app.use((req, res, next) => {
    // Always set CORS headers for all requests
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
    res.header('Access-Control-Max-Age', '86400')
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    
    next()
})

// Also configure cors package as backup
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: false,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 200
}))

app.use(express.json())

// Root route
app.get('/', (req, res) => {
    res.json({
        name: 'AI Travel Agent Backend API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            chat: 'POST /api/chat',
            location: {
                current: 'GET /api/location/current',
                save: 'POST /api/location/save',
                nearby: 'GET /api/location/nearby?country=USA',
                recommendations: 'GET /api/location/recommendations?userId=USER_ID&country=USA',
                explore: 'GET /api/location/explore?destination=Mexico'
            },
            travel: {
                weather: 'GET /api/travel/weather?location=Paris',
                location: 'GET /api/travel/location',
                flights: 'POST /api/travel/flights',
                hotels: 'POST /api/travel/hotels',
                activities: 'POST /api/travel/activities',
                restaurants: 'POST /api/travel/restaurants'
            },
            database: {
                trips: 'GET /api/database/trips?userId=user_123',
                saveTrip: 'POST /api/database/trips',
                deleteTrip: 'DELETE /api/database/trips/:id?userId=user_123',
                userPreferences: 'GET /api/database/user-preferences?userId=user_123',
                savePreferences: 'POST /api/database/user-preferences'
            },
            favorites: {
                list: 'GET /api/favorites?userId=user_123',
                add: 'POST /api/favorites',
                update: 'PUT /api/favorites/:id',
                delete: 'DELETE /api/favorites/:id?userId=user_123',
                filter: 'GET /api/favorites/filter?userId=user_123&type=destination'
            }
        }
    })
})

// Routes
app.use('/api/chat', chatRoutes)
app.use('/api/travel', travelRoutes)
app.use('/api/database', databaseRoutes)
app.use('/api/location', locationRoutes)
app.use('/api/favorites', favoritesRoutes)

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'AI Travel Agent Backend is running',
        environment: process.env.NODE_ENV || 'development'
    })
})

// Debug endpoint - check which env vars are set
app.get('/api/debug/env', (req, res) => {
    res.json({
        status: 'debug',
        environment_variables_configured: {
            SUPABASE_URL: !!process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
            SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
            GROQ_API_KEY: !!process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing',
            NODE_ENV: process.env.NODE_ENV || 'unset'
        },
        message: 'Set missing variables in Vercel Dashboard → Project Settings → Environment Variables'
    })
})

// Favicon handler - return 204 No Content instead of 500
app.get('/favicon.ico', (req, res) => {
    res.status(204).end()
})

// 404 handler - catch undefined routes and return proper 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        path: req.path,
        method: req.method,
        message: `Route ${req.method} ${req.path} not found`
    })
})

// Global error handler - MUST be last middleware, with 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
    // Prevent headers already sent error
    if (res.headersSent) {
        return next(err)
    }
    
    console.error('❌ Server Error:', err?.message || err)
    
    try {
        // Ensure CORS headers are set for error responses
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        
        const statusCode = err?.statusCode || err?.status || 500
        const message = err?.message || 'Internal Server Error'
        
        res.status(statusCode).json({
            success: false,
            error: message,
            message: message
        })
    } catch (handlerErr) {
        console.error('❌ Error Handler Exception:', handlerErr)
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        })
    }
})

// Export for Vercel serverless
export default app

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`)
    })
}
