
/**
 * Middleware global de seguridad.
 * Acá van headers de seguridad, rate limiting, etc.   
 * TODO: implementar
 */
export default function securityMiddleware(req, res, next) {
    // /middleware/security.middleware.js: Integra HELMET, RATELIMITER, MONGO-SANITIZE?, XSS-CLEAN?
    // app.use(cors()) ? lo puse en app.config.js pero capaz va aislado aca
    // {
    //     origin: ["https://didacta-ai.com"],
    //     methods: ["GET", "POST", "PUT", "DELETE"],
    //     credentials: true
    // }
}