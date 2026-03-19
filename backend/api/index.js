import app from '../server.js'

// CRITICAL: Add CORS middleware BEFORE everything else to catch all responses including errors
const corsMiddleware = (req, res, next) => {
    // Set CORS headers for ALL responses
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.setHeader('Access-Control-Max-Age', '86400')
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.setHeader('Content-Length', '0')
        return res.status(200).end()
    }
    
    next()
}

// Apply CORS to all routes
app.use(corsMiddleware)

// Add error handling middleware that preserves CORS headers
app.use((err, req, res, next) => {
    console.error('Error:', err)
    
    // Ensure CORS headers are on error responses too
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    })
})

export default app
