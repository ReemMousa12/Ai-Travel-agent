import app from '../server.js'

// Ensure CORS headers are sent for ALL responses - MUST be BEFORE routes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Max-Age', '86400')
    
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.setHeader('Content-Length', '0')
        return res.status(200).end()
    }
    next()
})

export default app
