import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const tempCodeSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 },
})

tempCodeSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next()
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

tempCodeSchema.methods.comparePassword = async function (input) {
    return await bcrypt.compare(input, this.password)
}


export const tempCodeModel = mongoose.model("TempCode", tempCodeSchema, "temp_code")