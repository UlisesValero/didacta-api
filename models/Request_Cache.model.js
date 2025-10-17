import mongoose from "mongoose"

export const requestCacheSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true }, // the hash key
        request: {
            headers: { type: Object, default: {} },
            body: { type: Object, default: {} },
        },
        response: {
            status: { type: Number, default: 200 },
            headers: { type: Object, default: {} },
            body: { type: mongoose.Schema.Types.Mixed }, // can store string or object
        },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);
// INFO TTL index: elimina automáticamente después de 10 minutos
requestCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 })

export const requestCacheModel = mongoose.model("RequestCache", requestCacheSchema, "request_cache")