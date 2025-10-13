import express from 'express'
import {
    login,
    perfilUsuario,
    google,
    resetPassword,
    newPassword,
    verificationEmail,
    register
} from './auth.controller.js'
import { jwtMiddleware } from '../../middlewares/jwt.middleware.js'

const router = express.Router()

router.post('/login', login)
router.post('/google', google)
router.post('/reset-password', resetPassword)
router.post('/new-password', newPassword)
router.post("/verification-email", verificationEmail)
router.post("/register", register)

router.get('/perfil', jwtMiddleware, perfilUsuario)

export default router
