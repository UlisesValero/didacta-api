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

export const loggerModel = mongoose.model("Logger", loggerSchema, "logger")
