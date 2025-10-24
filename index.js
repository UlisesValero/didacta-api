import { initApp } from './config/init-app.config.js'

import mongoose from 'mongoose'
import authRoutes from './src/auth/auth.routes.js'

await mongoose.connect(process.env.CONNECTION_STRING)


const routes = [{
    '/auth': authRoutes,
}]

initApp(routes)   