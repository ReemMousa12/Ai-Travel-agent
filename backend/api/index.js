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

// ====== CORS MIDDLEWARE - CRITICAL FOR VERCEL ======
// These MUST be the first middleware applied

// Preflight handler for OPTIONS requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.header('Access-Control-Max-Age', '86400')
    res.header('Access-Control-Allow-Credentials', 'false')
    res.status(200).end()
})

// Explicit CORS headers on ALL responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.header('Access-Control-Max-Age', '86400')
    res.header('Access-Control-Allow-Credentials', 'false')
    next()
})

// Also use cors package for additional compatibility
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Date'],
    credentials: false,
    maxAge: 86400
}))

// ====== END CORS MIDDLEWARE ======

app.use(express.json())

// Routes - Import AFTER all middleware
import chatRoutes from '../routes/chat.js'
import travelRoutes from '../routes/travel.js'
import databaseRoutes from '../routes/database.js'
import locationRoutes from '../routes/location.js'
import favoritesRoutes from '../routes/favorites.js'

// Root route
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

// Health check
app.get('/api/health', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.json({ 
        status: 'ok',
        message: '✅ AI Travel Agent Backend is running on Vercel',
        timestamp: new Date().toISOString(),
        cors: 'enabled'
    })
})

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
        // Ensure CORS headers are set even on error
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        
        const statusCode = err?.statusCode || err?.status || 500
        const message = err?.message || 'Internal Server Error'
        
        res.status(statusCode).json({
            success: false,
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? message : 'An error occurred',
            path: req.path,
            method: req.method
        })
    } catch (handlerErr) {
        console.error('❌ Error handler exception:', handlerErr)
        // Attempt to send error response, but don't crash if it fails
        try {
            res.status(500).json({ error: 'Internal Server Error' })
        } catch (e) {
            console.error('❌ Unable to send error response:', e)
        }
    }
})

// Export for Vercel
export default app
