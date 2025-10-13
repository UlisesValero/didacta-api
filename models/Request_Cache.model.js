import mongoose from "mongoose"

export const requestCacheSchema = new mongoose.Schema(
    {
        _id: "<hash>",          // cache key
        request: { headers: {}, body: {} }, // optional, for debugging
        response: { status: 200, headers: {}, body: "..." },
        createdAt: new Date()
    },
    { versionKey: false }
)

// INFO TTL index: elimina automáticamente después de 1 hora
requestCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 })

export const requestCacheModel = mongoose.model("RequestCache", requestCacheSchema, "request_cache")
