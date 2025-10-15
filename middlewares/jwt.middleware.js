import jwt from 'jsonwebtoken'
import { userModel } from '../models/User.model.js'
import { unprotectedRouteModel } from '../models/Unprotected_Route.model.js'
/**
 * Middleware global de firewall jwt.
 * Chequea el token de cada request que pase por él.
 * TODO DONE: invertir logica. protectRoute está siempre, pero busca primero en col unprotectedRoutes y deja pasar
 * TODO DONE: testear
 */
export const jwtMiddleware = async (req, res, next) => {
    let unprotectedRouteQuery = await unprotectedRouteModel.find()

    // TODO : implementar predicado que deje pasar por subpath: si /api/auth es unprotected, /api/auth/login y /api/auth/loquesea tambien
    const allowUnprotectedPredicate = (route) => {
        let result = false
        let routeSplit = route.nombre.split('/').filter(r => r !== '')
        let reqSplit = req.url.split('/').filter(r => r !== '')
        console.log(routeSplit, reqSplit)

        if (routeSplit.length > reqSplit.length) return false //la ruta protegida es mas larga que la request, no puede ser

        //si la ruta es exactamente igual, dejar pasar
        //if()

        for (let index = 0; index < routeSplit.length; index++) {
            if (routeSplit[index] === !reqSplit[index]) result = false
            //hay que empezar desde el principio de routeSplit y habilitar hasta donde reqSplit[i + 1] && !routeSplit[i + 1].
            //significa que el resto de la ruta es dinamica y no importa lo que venga despues, unprotectedRoute habilita todo el subpath
            if (routeSplit[index] !== reqSplit[index] && !routeSplit[index] && routeSplit[index - 1] === reqSplit[index - 1]) {
                result = true
            }
        }

        return result
    }

    //cambiar esto a 
    let unprotectedRoutes = unprotectedRouteQuery.some(r => allowUnprotectedPredicate(r))

    console.log(unprotectedRoutes)
    if (unprotectedRoutes) next()

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