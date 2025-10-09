import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'

const app = express()
app.use(cors())
// {
//     origin: ["https://didacta-ai.com"],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true
// }
app.use(express.json())

app.use('/api/auth', authRoutes)

const PORT = 8080
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
}).catch(err => console.error('❌ Error connecting to MongoDB:', err))

//test commit permisos