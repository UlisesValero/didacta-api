// import mongoose from "mongoose"



// TODO: NO ES NECESARIO ¿? SE BUSCA POR TOKEN UNA VEZ INICIADA SESIÓN
// export const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

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