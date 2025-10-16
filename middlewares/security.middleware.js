import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';

/**
 * Middleware global de seguridad.
 * Acá van headers de seguridad, rate limiting, etc.   
 */
export const securityMiddleware = (app) => {
    app.use(helmet())
    // rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 min
        max: 100,                 // limit por IP
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(limiter);
    // app.use(mongoSanitize()); //TODO: ta bug y deprecado http://stackoverflow.com/questions/79787302/cannot-set-property-query-of-incomingmessage-which-has-only-a-getter-when-u
    // app.use(xssClean());
}