import express from 'express'
import {
    login,
    perfilUsuario,
    google,
    resetPassword,
    newPassword,
    verificationEmail,
    register,
    googleHint
} from './auth.controller.js'
const router = express.Router()



router.post('/login', login)
router.post('/google', google)
router.post('/google-hint', googleHint)
router.post('/reset-password', resetPassword)
router.post('/new-password', newPassword)
router.post("/verification-email", verificationEmail)
router.post("/register", register)

router.get('/perfil', perfilUsuario)

export default router
