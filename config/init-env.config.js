import dotenv from 'dotenv'
import path from 'path';
import { existsSync } from 'fs';

export const initEnv = () => {
    const isDev = process.env.DIDACTA_ENV !== "production";
    const envPath = path.resolve(
        process.cwd(),
        isDev ? ".env.development" : ".env"
    );

    if (existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true })
    }
    else {
        dotenv.config();
    }
}