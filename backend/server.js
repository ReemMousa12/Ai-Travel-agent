import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables FIRST before importing routes
dotenv.config({ path: path.join(__dirname, '.env') })

import chatRoutes from './routes/chat.js'
import travelRoutes from './routes/travel.js'
import databaseRoutes from './routes/database.js'
import locationRoutes from './routes/location.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware - CORS Configuration (MUST be FIRST)
// Allow all origins with credentials
app.use(cors({
    origin: ['https://ai-travel-agent-fn9y.vercel.app', 'http://localhost:5173', 'http://localhost:3001', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
}))

// Explicitly handle OPTIONS requests
app.options('*', cors())

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
            }
        }
    })
})

// Routes
app.use('/api/chat', chatRoutes)
app.use('/api/travel', travelRoutes)
app.use('/api/database', databaseRoutes)
app.use('/api/location', locationRoutes)

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Travel Agent Backend is running' })
})

// Export for Vercel serverless
export default app

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`)
    })
}
