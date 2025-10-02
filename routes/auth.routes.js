import express from 'express'
import {
  registerUser,
  loginUser,
  perfilUsuario,
  loginGoogle,
  resetPassword
} from '../controllers/auth.controller.js'
import { protectRoute } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/google', loginGoogle)
router.post('/reset-password', resetPassword)


//proteger ruta
router.get('/perfil', protectRoute, perfilUsuario)

export default router
