import app from '../server.js'

/**
 * Vercel Serverless Handler
 * Apply CORS headers to all responses
 */

// 1. Handle preflight OPTIONS requests
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.status(204).end()
})

// 2. CORS middleware - applied to all requests FIRST
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    next()
})

// Export for Vercel
export default app
