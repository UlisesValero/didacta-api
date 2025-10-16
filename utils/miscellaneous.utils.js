import { v4 as uuid } from "uuid"
import jwt from 'jsonwebtoken'


export class AppError extends Error {
    constructor(message = "Internal App Error", status = 500, log = true) {
        super(message)
        this.status = status
        this.log = log
    }
}

export const newId = () => {
    return uuid()
}

export const jwtSign = (key, expiresIn) => {
    try {
        return jwt.sign({ key }, process.env.JWT_SECRET, { expiresIn: expiresIn })
    } catch {
        return null
    }
}

export const jwtVerify = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET)
    }
    catch {
        return null
    }
}
