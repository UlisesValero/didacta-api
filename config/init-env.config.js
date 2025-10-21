import dotenv from 'dotenv'
import path from 'path';
import { existsSync } from 'fs';

export const initEnv = () => new Promise((resolve, reject) => {
    try {
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

        resolve(true)
    } catch (error) {
        reject(error)
    }
}) 