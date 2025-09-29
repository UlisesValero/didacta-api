import jwt from 'jsonwebtoken'
import { userModel } from '../models/User.js'
import dotenv from 'dotenv'
import { OAuth2Client } from 'google-auth-library'
import { validateEmail, validatePassword, validateObjectId } from '../utils/validation.js'

dotenv.config()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export const loginGoogle = async (req, res) => {
  try {
    const { id_token } = req.body
    if (!id_token) return res.status(400).json({ message: 'Falta id_token de Google' })

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()

    let usuario = await userModel.findOne({ email: payload.email })
    if (!usuario) {
      usuario = await userModel.create({
        googleId: payload.sub,
        nombre: payload.name,
        email: payload.email,
        foto: payload.picture,
        rol: 'empleado'
      })
    }

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      foto: usuario.foto,
      rol: usuario.rol,
      token: generarToken(usuario._id)
    })
  } catch (err) {
    console.error('❌ Error Google Login:', err)
    res.status(401).json({ message: 'Token de Google inválido' })
  }
}

export const registrarUsuario = async (req, res) => {
  const { name, email, password } = req.body
  try {
    const existe = await userModel.findOne({ email })
    if (existe) return res.status(400).json({ message: 'User already exists' })

    if(!validateEmail(email)) {
      return res.status(400).json({message: "Email does not meet the required format."})
    }

    if(!validatePassword(password)) {
      return res.status(400).json({message: "The password does not meet the required security format."})
    }

    const newUser = await userModel.create({ name, email, password })


    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token: generarToken(newUser._id)
    })
  } catch (err) {
    console.error('Error al registrar usuario:', err)
    res.status(500).json({ message: 'Error al registrar usuario' })
  }
}

export const loginUsuario = async (req, res) => {
  const { email, password } = req.body
  try {
    const usuario = await userModel.findOne({ email })
    if (!usuario || !(await usuario.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
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
