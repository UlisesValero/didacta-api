import Logger from "../models/Logger.model.js"

/**
 * Middleware global de manejo de errores.
 * Registra en la colección `log` cualquier error no marcado con `log: false`.
 * TODO: testear
 */
export const loggerMiddleware = async (err, req, res, next) => {
    try {
        // Solo loggea si no se marcó explícitamente log: false
        if (err.log !== false) {
            await Logger.create({
                message: err.message || "Error desconocido",
                stack: err.stack || null,
                route: req.originalUrl,
                method: req.method,
                status: err.status || 500,
                date: new Date(),
            })
        }

        res
            .status(err.status || 500)
            .json({ success: false, message: err.message || "Internal server error" })
    } catch (logError) {
        console.error("Error registrando log:", logError)
        res.status(500).json({ success: false, message: "Error interno" })
    }
}

/**
 * Helper para envolver controladores async y centralizar try/catch.
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}
