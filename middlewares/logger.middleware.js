import { loggerModel } from "../models/Logger.model.js"
import { AppError, newId } from "../utils/miscellaneous.utils.js"

/**
 * Middleware global de manejo de errores.
 * Registra en la colección `log` cualquier error no marcado con `log: false`.
 */
export const loggerMiddleware = async (err, req, res, next) => {
    try {
        const id = newId().toString()
        err.id = id

        await loggerModel.create({
            id: id,
            message: err.message || "Error desconocido",
            stack: err.stack || null,
            route: req.originalUrl,
            method: req.method,
            status: err.status,
            date: new Date(),
            uncaught: err instanceof AppError
        })

        res
            .status(err.status || 500)
            .json({ ...err, success: false, message: err.message || "Error del servidor" })
    } catch (logError) {
        res.status(500).json({ success: false, message: "Error interno @logger.middleware.js" })
    }
}