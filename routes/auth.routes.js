import express from 'express'
import {
  registrarUsuario,
  loginUsuario,
  perfilUsuario,
  loginGoogle
} from '../controllers/auth.controller.js'
import { protectRoute } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/register', registrarUsuario)
router.post('/login', loginUsuario)
router.post('/google', loginGoogle)


//proteger ruta
router.get('/perfil', protectRoute, perfilUsuario)

export default router
