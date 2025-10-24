import { json, urlencoded } from 'express'
import cors from 'cors'

import express from 'express'

import { cacheMiddleware } from '../middlewares/cache.middleware.js'
import { securityMiddleware } from '../middlewares/security.middleware.js'
import { jwtMiddleware } from '../middlewares/jwt.middleware.js'
import { loggerMiddleware } from '../middlewares/logger.middleware.js'

/**
 * Inicialización de la aplicación.
 * @param {Array<{ path: string, handler: (req: any, res: any) => Promise<void> }>} routes Array de rutas a registrar con formato `[{ path: handler }]`
 */
export async function initApp(routes) {
    const app = express()
    app.use(cors())
    app.use(json({ limit: '50mb' }))
    app.use(urlencoded({ extended: true, limit: '50mb' }));
    securityMiddleware(app) // Middleware de seguridad - primero siempre
    app.use(cacheMiddleware) // Middleware de cache 

    app.use(jwtMiddleware) // Middleware de JWT, capa de autenticación

    /**
     * Helper para envolver controladores async y centralizar try/catch:
     * Express will only invoke an error-handling middleware (signature (err, req, res, next)) when an error is explicitly passed to:
     * `next(err)` from a route or middleware.
     * Placing it last in the stack is necessary but not sufficient — it won’t receive anything unless something upstream calls next(err).
     */
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }

    routes.forEach(route => {
        const path = Object.keys(route)[0]
        const handler = asyncHandler(route[path])
        app.use(path, handler)
    })

    app.use(loggerMiddleware) // Middleware de manejo de errores - ultimo siempre
    app.listen(8080, () => console.log(`✅ Server ON @8080`))
}

