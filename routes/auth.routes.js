import express from 'express'
import {
    loginUser,
    perfilUsuario,
    loginGoogle,
    resetPassword,
    newPassword,
    sendVerifEmail,
    register
} from '../controllers/auth.controller.js'
import { protectRoute } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/login', loginUser)
router.post('/google', loginGoogle)
router.post('/reset-password', resetPassword)
router.post('/new-password', newPassword)
router.post("/verification-email", sendVerifEmail)
router.post("/register", register)

//PROTEGER RUTA ¿CUALES SI? ¿CUALES NO?
router.get('/perfil', protectRoute, perfilUsuario)

export default router
