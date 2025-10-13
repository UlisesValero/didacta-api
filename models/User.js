import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    foto: { type: String },
    resetToken: { type: String },
    resetTokenExpire: { type: Date },
}, { timestamps: true })

//cuando reestables la contraseña borrar el token
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next()
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

userSchema.methods.comparePassword = async function (input) {
    if(this.googleId) return false
    
    return await bcrypt.compare(input, this.password)

}


export const userModel = mongoose.model('usuario', userSchema)
