import { loggerModel } from "../models/Logger.model.js"
import { newId } from "../utils/miscellaneous.utils.js"

/**
 * Middleware global de manejo de errores.
 * Registra en la colección `log` cualquier error no marcado con `log: false`.
 * TODO: testear
 */
export const loggerMiddleware = async (err, req, res, next) => {
    try {
        console.log('❌ Error capturado por loggerMiddleware:', err.message)
        const id = newId().toString()
        if (err.log !== false || err.status == 500 || typeof (err) === 'AppError') {
            await loggerModel.create({
                id: id,
                message: err.message || "Error desconocido",
                stack: err.stack || null,
                route: req.originalUrl,
                method: req.method,
                status: err.status,
                date: new Date(),
            })
        }

        res
            .status(err.status || 500)
            .json({ success: false, message: err.message || "Error del servidor" })
    } catch (logError) {
        console.error("Error registrando log:", logError)
        res.status(500).json({ success: false, message: "Error interno @logger.middleware.js" })
    }
}


