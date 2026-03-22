import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables - MUST be before any route imports
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Handle environment variables - Vercel uses VITE prefix for some, standard for others
// Set standard names from VITE prefixed versions if available (Vercel)
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL
}
if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
}


// Create app for Vercel
const app = express()

// Add early logging for debugging
console.log('🚀 Initializing Vercel API...')
console.log('Environment vars status:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY
})

// ====== CORS MIDDLEWARE - CRITICAL FOR VERCEL ======
// These MUST be the first middleware applied
// Key: Options handler must come BEFORE general middleware

// Preflight handler for OPTIONS requests - handle before everything else
app.options('*', cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: false,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 200
}))

// Apply CORS to all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-Page-Count'],
    credentials: false,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 200
}))

// Fallback: Explicit CORS headers to ensure they're always present
app.use((req, res, next) => {
    // Always set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Total-Count, X-Page-Count')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.setHeader('Access-Control-Allow-Credentials', 'false')
    next()
})

// ====== END CORS MIDDLEWARE ======

app.use(express.json())

// Root route - MUST come before others to ensure it loads
app.get('/', (req, res) => {
    res.json({
        name: 'AI Travel Agent Backend API',
        version: '1.0.0',
        status: '✅ running on Vercel',
        environment: 'vercel',
        endpoints: {
            health: '/api/health',
            database: '/api/database/*',
            chat: '/api/chat',
            location: '/api/location/*',
            travel: '/api/travel/*',
            favorites: '/api/favorites/*'
        }
    })
})

// Health check - MUST work even if routes fail
app.get('/api/health', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.json({ 
        status: 'ok',
        message: '✅ AI Travel Agent Backend is running on Vercel',
        timestamp: new Date().toISOString(),
        cors: 'enabled',
        environment: {
            SUPABASE_URL: !!process.env.SUPABASE_URL ? '✅' : '❌',
            SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY ? '✅' : '❌',
            GROQ_API_KEY: !!process.env.GROQ_API_KEY ? '✅' : '❌'
        }
    })
})

// Diagnostic endpoint
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'running',
        message: 'Debug information',
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
            GROQ_API_KEY: !!process.env.GROQ_API_KEY
        },
        timestamp: new Date().toISOString()
    })
})

// Routes - Import AFTER all middleware
import chatRoutes from '../routes/chat.js'
import travelRoutes from '../routes/travel.js'
import databaseRoutes from '../routes/database.js'
import locationRoutes from '../routes/location.js'
import favoritesRoutes from '../routes/favorites.js'

// Register all API routes
app.use('/api/chat', chatRoutes)
app.use('/api/travel', travelRoutes)
app.use('/api/database', databaseRoutes)
app.use('/api/location', locationRoutes)
app.use('/api/favorites', favoritesRoutes)

// 404 handler - must be last route
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: {
            root: 'GET /',
            health: 'GET /api/health',
            api: 'GET /api/*'
        }
    })
})

// Error handler - must be last middleware (4 parameters for error handler)
app.use((err, req, res, next) => {
    // Prevent "headers already sent" errors
    if (res.headersSent) {
        return next(err)
    }
    
    console.error('❌ Server error:', err?.message || err)
    
    try {
        // Ensure CORS headers are set even on error - use setHeader for reliability
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Total-Count, X-Page-Count')
        res.setHeader('Content-Type', 'application/json')
        
        const statusCode = err?.statusCode || err?.status || 500
        const message = err?.message || 'Internal Server Error'
        
        res.status(statusCode).json({
            success: false,
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? message : 'An error occurred',
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        })
    } catch (handlerErr) {
        console.error('❌ Error handler exception:', handlerErr)
        // Attempt to send error response, but don't crash if it fails
        try {
            // Set CORS headers one more time as fallback
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Content-Type', 'application/json')
            res.status(500).json({ error: 'Internal Server Error' })
        } catch (e) {
            console.error('❌ Unable to send error response:', e)
        }
    }
})

// Export for Vercel
console.log('✅ API initialization complete')
export default app
