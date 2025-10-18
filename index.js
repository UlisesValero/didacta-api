import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './src/auth/auth.routes.js'
import appConfig from './config/app.config.js'
import { cualquiera } from './src/auth/auth.controller.js'
import { initEnv } from './config/init-env.config.js'

initEnv()
const app = express()
const PORT = 8080

const ejemplo = express.Router()

ejemplo.get('/', cualquiera)
//INFO: defino las rutas acá para pasarlas a appConfig
const routes = [{
    '/auth': authRoutes,
    '/ejemplo': ejemplo
}]

//INFO: necesario primero primero para que los middleware que usan la DB funcionen
mongoose.connect(process.env.CONNECTION_STRING).then(() => {
    console.log('✅ MongoDB ON');
    appConfig(app, routes)
    app.listen(PORT, () => console.log(`✅ Server ON @${PORT}`))
}).catch(err => console.error('❌ App startup error', err))
