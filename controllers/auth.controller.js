import dotenv from 'dotenv'
dotenv.config()

import jwt from 'jsonwebtoken'
import { userModel } from '../models/User.js'
import { OAuth2Client } from 'google-auth-library'
import { validateEmail, validatePassword } from '../utils/validation.js'
import { sendEmail } from "../utils/resend.js";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const generarToken = (id) => {
    try {
        return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
    } catch (error) {
        return null
    }
}

const generarTokenReset = (email) => {
    try {
        return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" })
    } catch (error) {
        return null
    }
}

export const loginGoogle = async (req, res) => {
    try {
        const { id_token } = req.body
        if (!id_token) return res.status(400).json({ message: 'Id_Token from google missing' })

        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        const payload = ticket.getPayload()

        let usuario = await userModel.findOne({ email: payload.email })
        if (!usuario) {
            usuario = await userModel.create({
                googleId: payload.sub,
                name: payload.name,
                email: payload.email,
                foto: payload.picture
            })
        }

        res.json({
            _id: usuario._id,
            name: usuario.name,
            email: usuario.email,
            foto: usuario.foto,
            token: generarToken(usuario._id)
        })
    } catch (err) {
        console.error('❌ Error Google Login:', err)
        res.status(401).json({ message: 'Token de Google inválido' })
    }
}


export const loginUser = async (req, res) => {
    const { email, password } = req.body
    console.log(req.body)
    try {
        const usuario = await userModel.findOne({ email })
        if (!usuario || !(await usuario.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        res.status(200).json({
            _id: usuario._id,
            name: usuario.name,
            email: usuario.email,
            token: generarToken(usuario._id)
        })
    } catch (err) {
        res.status(500).json({ message: 'Error al iniciar sesión' })
    }
}

export const perfilUsuario = async (req, res) => {
    try {
        res.json(req.usuario)
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener perfil' })
    }
}

export const resetPassword = async (req, res) => {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: "El correo es requerido" })

    try {
        const user = await userModel.findOne({ email })
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" })

        const token = generarTokenReset(email)
        user.resetToken = token
        user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 min, YO LO BAJARÍA AÚN MÁS
        await user.save()

        //REEMPLAZAR POR DOMINIO DE DIDACTA (CONSULTAR CON REDO)
        const resetLink = process.env.APP_URL + `/reset-password/${token}`

        const response = await sendEmail({
            to: email,
            subject: "Restablece tu contraseña - Didacta",
            text: `Haz click en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
            html: `
        <div style="font-family:Arial,sans-serif">
          <h3>Restablecimiento de contraseña</h3>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
          <p>Este enlace expirará en 15 minutos.</p>
        </div>
      `,
        })

        if (response.success) {
            return res.json({ message: "📩 Correo de restablecimiento enviado" })
        } else {
            return res.status(500).json({ message: "Error enviando el correo", error: response.error })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error en el servidor", error })
    }
}

export const newPassword = async (req, res) => {
    const { token, password } = req.body
    console.log("RESET", req.body)

    if (!token || !password) {
        return res.status(400).json({ message: "Token y nueva contraseña son requeridos" })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findOne({
            email: decoded.email,
            resetToken: token,
            resetTokenExpire: { $gt: Date.now() },
        })

        if (!user) {
            return res.status(400).json({ message: "Token inválido o expirado ?" })
        }

        user.password = String(password)
        user.resetToken = undefined
        user.resetTokenExpire = undefined
        await user.save()

        res.json({ message: "✅ Contraseña actualizada correctamente." })
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: "Token inválido o expirado" })
    }
}

const verificationCodes = new Map()
const pendingUsers = new Map()

// INSERTAR HTML AL CUERPO DEL CORREO ELECTRÓNICO
export const verificationEmail = async (req, res) => {
    const { name, email, password } = req.body

    if (!email || !name || !password)
        return res.status(400).json({ success: false, message: "Datos incompletos" })

    try {
        const existe = await userModel.findOne({ email })
        if (existe)
            return res.status(400).json({ success: false, message: "El usuario ya existe" })

        if (!validateEmail(email))
            return res.status(400).json({ success: false, message: "Formato de email inválido" })

        if (!validatePassword(password))
            return res.status(400).json({ success: false, message: "Contraseña insegura" })

        const code = Math.floor(10000 + Math.random() * 90000).toString()
        verificationCodes.set(email, code)
        pendingUsers.set(email, { name, password })

        const verificationEmail = await sendEmail({
            to: email,
            subject: "Código de verificación Didacta",
            text: `Tu código de verificación es: ${code}`,
        })

        if (verificationEmail.success)
            return res.json({ success: true, message: "📩 Código enviado a tu correo" })
        else
            return res.status(500).json({ success: false, message: "Error enviando el correo" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: "Error en el servidor" })
    }
}

export const verifyCode = async (req, res) => {
    const { email, code } = req.body
    if (!email || !code)
        return res.status(400).json({ success: false, message: "Datos incompletos" })

    const storedCode = verificationCodes.get(email)
    if (!storedCode)
        return res.status(400).json({ success: false, message: "No hay código asociado" })

    if (storedCode !== code)
        return res.status(400).json({ success: false, message: "Código incorrecto" })

    const pending = pendingUsers.get(email)
    if (!pending)
        return res.status(400).json({ success: false, message: "No hay registro pendiente" })

    try {
        const newUser = new userModel({
            name: pending.name,
            email,
            password: pending.password,
        })

        const token = generarToken(newUser._id)
        await newUser.save()

        verificationCodes.delete(email)
        pendingUsers.delete(email)

        return res.json({
            success: true,
            message: "✅ Usuario verificado y registrado",
            token,
        })
    } catch (err) {
        console.error("Error al registrar usuario:", err)
        res.status(500).json({ success: false, message: "Error creando usuario" })
    }
}

// ESTO ES SIN CODIGO DE VERIFICACIÓN, ES DECIR, FLUJO DIRECTO. REMOVER ? HABLAR CON REDO
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body
    try {
        const existe = await userModel.findOne({ email })
        if (existe)
            return res.status(400).json({ message: "User already exists" })

        if (!validateEmail(email))
            return res.status(400).json({ message: "Email does not meet the required format." })

        if (!validatePassword(password))
            return res.status(400).json({ message: "The password does not meet the required security format." })

        const newUser = new userModel({ name, email, password })
        const token = generarToken(newUser._id)

        if (!token)
            return res.status(400).json({ message: "No token was generated" })

        await newUser.save()

        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            token,
        })
    } catch (err) {
        console.error("Error al registrar usuario:", err)
        res.status(500).json({ message: "Error al registrar usuario" })
    }
}