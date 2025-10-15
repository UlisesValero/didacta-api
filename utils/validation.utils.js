export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    return regex.test(email)
}

export const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/

    return regex.test(password)
}

export const sanitizeInput = (input) => {

    return input.toString().trim().replace(/[<>]/g, "")
}

export class AppError extends Error {
    constructor(message, status = 500, log = true) {
        super(message)
        this.status = status
        this.log = log
    }
}