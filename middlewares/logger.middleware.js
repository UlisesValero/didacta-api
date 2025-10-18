import { loggerModel } from "../models/Logger.model.js"
import { newId } from "../utils/miscellaneous.utils.js"

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
            uncaught: typeof (err) != "AppError"
        })

        res
            .status(err.status || 500)
            .json({ ...err, success: false, message: err.message || "Error del servidor" })
    } catch (logError) {
        res.status(500).json({ success: false, message: "Error interno @logger.middleware.js" })
    }
}

// const url = process.env.DISCORD_WEBHOOK_URL;
//             console.log('URLDISCORD', url)
//             if (!url) return;

//             const discordMsg = {
//                 username: 'Didacta API Error Logger',
//                 embeds: [
//                     {
//                         title: `❌ LOG ID: ${log.id || 'N/A'}`,
//                         description: `\`\`\`${err.message}\`\`\``,
//                         color: 16711680,
//                         fields: [
//                             { name: 'Stack', value: `\`\`\`@${err.stack?.slice(0, 10000) || 'N/A'}\`\`\`` },
//                         ],
//                         timestamp: new Date().toISOString()
//                     }
//                 ]
//             };

//             await fetch(url, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(discordMsg)
//             });