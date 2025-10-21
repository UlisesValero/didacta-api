import mongoose from "mongoose"
import bcrypt from "bcryptjs"

export const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        googleId: { type: String },
        foto: { type: String },
        pending: { type: Boolean, default: false },
        pendingFrom: { type: Date, default: null },
        tempToken: { type: String },
        tempTokenExpire: {
            type: Date,
            default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 min (info: La razón del default asi es porque se evalúa una sola vez al cargar el modelo, no en cada documento nuevo.)
        },
    },
    { timestamps: true }
)

userSchema.index({ pendingFrom: 1 }, { expireAfterSeconds: 900 })

userSchema.pre("save", async function (next) {
    if (this.tempToken && !this.tempTokenExpire) this.tempTokenExpire = new Date(Date.now() + 15 * 60 * 1000)
    if (!this.tempToken && this.tempTokenExpire) this.tempTokenExpire = null
    this.pendingFrom = this.pending ? new Date() : null
    if (this.isModified("password") && this.password) {
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
    }

    next()
})

userSchema.methods.comparePassword = async function (input) {
    if (this.googleId || !this.password) return false
    return await bcrypt.compare(input, this.password)
}

export const userModel = mongoose.model("user", userSchema, "user")