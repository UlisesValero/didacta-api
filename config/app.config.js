//INFO: este archivo, `app.config.js` es necesario porque el orden de los use es crucial
import { json, urlencoded } from 'express'
import cors from 'cors'

import { cacheMiddleware } from '../middlewares/cache.middleware.js'
import { securityMiddleware } from '../middlewares/security.middleware.js'
import { jwtMiddleware } from '../middlewares/jwt.middleware.js'
// import { cacheMiddleware } from '../middlewares/cache.middleware.js'
import { loggerMiddleware } from '../middlewares/logger.middleware.js'

/**
 * Configuración de la aplicación.
 * @param {*} app 
 * @param {*} routes 
 */
export default function appConfig(app, routes) {
    app.use(cors())
    app.use(json({ limit: '50mb' }))
    app.use(urlencoded({ extended: true, limit: '50mb' }));
    app.use(cacheMiddleware) // Middleware de cache 
    securityMiddleware(app) // Middleware de seguridad - primero siempre

    app.use(jwtMiddleware) // Middleware de JWT, capa de autenticación

    routes.forEach(route => {
        const path = Object.keys(route)[0]
        const handler = asyncHandler(route[path])
        app.use(path, handler)
    })

    app.use(loggerMiddleware) // Middleware de manejo de errores - ultimo siempre
}

/**
 * Helper para envolver controladores async y centralizar try/catch:
 * Express will only invoke an error-handling middleware (signature (err, req, res, next)) when an error is explicitly passed to:
 * `next(err)` from a route or middleware.
 * Placing it last in the stack is necessary but not sufficient — it won’t receive anything unless something upstream calls next(err).
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}
