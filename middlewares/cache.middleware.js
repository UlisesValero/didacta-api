import { requestCacheModel } from "../models/Request_Cache.model.js";
import { URL } from "url";
import { sha512 } from "../utils/miscellaneous.utils.js";
import { stableStringify } from "../utils/validation.utils.js";

/**
 * Middleware de cache.
 * Guarda `req` y `res` en un cache (_id de cache) hasheado, y si lo encuentra, devuelve lo guardado.
 * 
 * cacheMiddleware installs res.send wrapper → next() hands over control →
 * route handler runs → route handler calls res.send() →
 * your wrapper runs, saves cache, then calls originalSend() → client gets response
 * 
 * https://chatgpt.com/share/68f1ced1-a764-8000-bc37-755f1fd4169b
 */
export async function cacheMiddleware(req, res, next) {
    // Skip if payload is too large
    const MAX_CONTENT_LENGTH = 1 * 1024 * 1024; // 1 MB
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > MAX_CONTENT_LENGTH) return next();

    try {
        const key = makeCacheKey(req);
        const cached = await requestCacheModel.findById(key);

        if (cached) {
            console.log('✅ Cache hit for key:', key);
            res.set(cached.response.headers || {});
            res.status(cached.response.status).send(cached.response.body);
            return;
        }

        const originalSend = res.send.bind(res);
        res.send = async (body) => {
            try {
                console.log('✅ Cache miss for key:', key, ' - caching response.');
                await requestCacheModel.create({
                    _id: key,
                    request: { headers: req.headers, body: req.body },
                    response: {
                        status: res.statusCode,
                        headers: res.getHeaders(),
                        body,
                    },
                    createdAt: new Date(),
                });
            } catch (err) {
                console.error("Cache write error:", err);
            }
            return originalSend(body);
        };

        next();
    } catch (err) {
        console.error("Cache middleware error:", err);
        next();
    }
}


export function makeCacheKey(req) {
    // Parse without relying on Host (avoids variance)
    const url = new URL(req.originalUrl, "http://x");
    const path = url.pathname.toLowerCase().replace(/\/+$/, "");
    const query = [...url.searchParams.entries()]
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("&");

    // Body: prefer raw buffer; otherwise stable JSON
    let bodyPart = "";
    if (req.rawBody && req.rawBody.length) {
        bodyPart = `bin:${req.rawBody.length}:${sha512(req.rawBody)}`;
    } else if (req.body && Object.keys(req.body).length) {
        const stable = stableStringify(req.body);
        bodyPart = `json:${sha512(Buffer.from(stable))}`;
    }

    // NOTE: removed stray '}' after ${query}
    const rawKey = `${req.method.toUpperCase()}|${path}|${query}|${bodyPart}`;
    return sha512(Buffer.from(rawKey));
}