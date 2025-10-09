import express from 'express'
import {
  // registerUser,
  loginUser,
  perfilUsuario,
  loginGoogle,
  resetPassword,
  newPassword,
  verificationEmail,
  verifyCode
} from '../controllers/auth.controller.js'
import { protectRoute } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/login', loginUser)
router.post('/google', loginGoogle)
router.post('/reset-password', resetPassword)
router.post('/new-password', newPassword)
router.post("/verification-email", verificationEmail)
router.post("/verify-code", verifyCode)
// router.post('/register', registerUser) ESTO ES SIN CODIGO DE VERIFICACIÓN

//PROTEGER RUTA ¿CUALES SI? ¿CUALES NO?
router.get('/perfil', protectRoute, perfilUsuario)

export default router
