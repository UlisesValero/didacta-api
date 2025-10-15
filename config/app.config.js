//INFO: esta función es necesaria porque el orden de los use es crucial
import { json } from 'express'
import cors from 'cors'

import { securityMiddleware } from '../middlewares/security.middleware.js'
import { jwtMiddleware } from '../middlewares/jwt.middleware.js'
import { cacheMiddleware } from '../middlewares/cache.middleware.js'
import { loggerMiddleware } from '../middlewares/logger.middleware.js'

/**
 * Configuración de la aplicación.
 * @param {*} app 
 * @param {*} routes 
 */
export default function appConfig(app, routes) {
    app.use(cors())
    app.use(json())

    app.use(securityMiddleware) // Middleware de seguridad - primero siempre
    app.use(jwtMiddleware) // Middleware de JWT, capa de autenticación
    app.use(cacheMiddleware) // Middleware de cache

    routes.forEach(route => {
        const path = Object.keys(route)[0]
        const handler = route[path]
        app.use(path, handler)
    })

    app.use(loggerMiddleware) // Middleware de manejo de errores - ultimo siempre
}