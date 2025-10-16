import jwt from 'jsonwebtoken'
import { userModel } from '../models/User.model.js'
import { unprotectedRouteModel } from '../models/Unprotected_Route.model.js'

/**
 * Middleware global de firewall jwt.
 * Chequea el token de cada request que pase por él.
 */
export const jwtMiddleware = async (req, res, next) => {
    let unprotectedRoutes = await unprotectedRouteModel.find()
    let url = req.url.toLowerCase()

    for (const route of unprotectedRoutes) {
        const name = route.nombre.toLowerCase()
        if (url.startsWith(name)) return next()
    }

    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no enviado' })
    }

    try {
        const token = auth.split(' ')[1]
        const decodificado = jwt.verify(token, process.env.JWT_SECRET)

        const usuario = await userModel.findById(decodificado.id).select('-contraseña')
        if (!usuario) {
            return res.status(401).json({ message: 'Usuario no encontrado' })
        }

        req.usuario = usuario
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' })
    }
}