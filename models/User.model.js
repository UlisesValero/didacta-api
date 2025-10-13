import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    foto: { type: String },
    tempToken: { type: String, expires: 900 },
    tempTokenExpire: { type: Date, default: Date.now, expires: 900 } // 15 minutos,
}, { timestamps: true })

//cuando reestableces la contraseña borrar el token
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        this.tempToken = undefined
        this.tempTokenExpire = undefined
        return next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

userSchema.methods.comparePassword = async function (input) {
    if (this.googleId) return false

    return await bcrypt.compare(input, this.password)
}

//nombre del modelo, esquema, nombre de la colección en la DB
export const userModel = mongoose.model('user', userSchema, 'user') 