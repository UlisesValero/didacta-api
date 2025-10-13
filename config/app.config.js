//INFO: esta función es necesaria porque el orden de los use importa
import { json } from 'express'
import cors from 'cors'
import { loggerMiddleware } from '../middlewares/logger.middleware.js'

/**
 * Configuración de la aplicación.
 * @param {*} app 
 * @param {*} routes 
 */
export default function appConfig(app, routes) {
    app.use(cors())
    app.use(json())

    routes.forEach(route => {
        const path = Object.keys(route)[0]
        const handler = route[path]
        app.use(path, handler)
    })

    app.use(loggerMiddleware) // Middleware de manejo de errores - ultimo siempre
}