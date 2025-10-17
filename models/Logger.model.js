import mongoose from "mongoose"

const loggerSchema = new mongoose.Schema(
    {
        message: { type: String, required: true },
        stack: { type: String },
        route: { type: String },
        method: { type: String },
        status: { type: Number },
        date: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 }, // 7 días
        uncaught: { type: Boolean, default: false },
    },
    { versionKey: false }
)

// INFO TTL index: elimina logs automáticamente después de 7 días
// TODO: usar para temptoken
// loggerSchema.index({ date: 1 }, { expireAfterSeconds: 60 })

export const loggerModel = mongoose.model("Logger", loggerSchema, "logger")
