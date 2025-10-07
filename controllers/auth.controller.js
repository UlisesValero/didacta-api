import dotenv from 'dotenv'
dotenv.config()

import jwt from 'jsonwebtoken'
import { userModel } from '../models/User.js'
import { OAuth2Client } from 'google-auth-library'
import { validateEmail, validatePassword } from '../utils/validation.js'
import { sendEmail } from "../utils/resend.js";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
console.log(process.env.GOOGLE_CLIENT_ID)

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

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body
  try {
    const existe = await userModel.findOne({ email })
    if (existe) return res.status(400).json({ message: 'User already exists' })

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Email does not meet the required format." })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "The password does not meet the required security format." })
    }

    const newUser = new userModel({ name, email, password })

    const token = generarToken(newUser._id)
    if (!token) {
      return res.status(400).json({ message: "No token was generated" })
    }

    await newUser.save()

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token
    })
  } catch (err) {
    console.error('Error al registrar usuario:', err)
    res.status(500).json({ message: 'Error al registrar usuario' })
  }
}

export const loginUser = async (req, res) => {
  const { email, password } = req.body
  try {
    const usuario = await userModel.findOne({ email })
    if (!usuario || !(await usuario.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    res.json({
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
    const token = generarTokenReset(email)
    if (!token) return res.status(500).json({ message: "Error generando el token" })

    // INSERTAR DOMINIO VERDADERO - PENDIENTE - VINCULAR CON EL FETCH DEL FRONT
    const resetLink = `http://localhost:3000/api/auth/reset-password/${token}`;

    const response = await sendEmail({
      to: email,
      subject: "Restablece tu contraseña - Didacta",
      text: `Haz click en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
      html: `<p>Haz click en el siguiente enlace para restablecer tu contraseña:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    })

    if (response.success) {
      return res.json({ message: "📩 Correo de restablecimiento enviado" })
    } else {
      return res.status(500).json({ message: "Error enviando el correo", error: response.error })
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error })
  }
}


export const newPassword = async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    return res.status(400).json({ message: "Token y nueva contraseña son requeridos" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await userModel.findOne({ email: decoded.email })
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save()

    res.json({ message: "✅ Contraseña actualizada correctamente." })
  } catch (error) {
    res.status(400).json({ message: "Token inválido o expirado" })
  }
}
