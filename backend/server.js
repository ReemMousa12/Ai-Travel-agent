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

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
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
                bookmarks: 'GET /api/database/bookmarks?userId=user_123',
                saveBookmark: 'POST /api/database/bookmarks'
            }
        }
    })
})

// Routes
app.use('/api/chat', chatRoutes)
app.use('/api/travel', travelRoutes)
app.use('/api/database', databaseRoutes)

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Travel Agent Backend is running' })
})

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`)
})
