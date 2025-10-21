import { OAuth2Client } from 'google-auth-library'
import { userModel } from '../../models/User.model.js'
import { validateEmail, validatePassword } from '../../utils/validation.utils.js'
import { sendEmail } from "../../utils/resend.utils.js";
import { AppError, HttpStatus, jwtSign, jwtVerify } from '../../utils/miscellaneous.utils.js'

export const google = async (req, res) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    const { id_token } = req.body

    if (!id_token) throw new AppError('GOOGLE_CLIENT_ID no encontrado en entorno.', HttpStatus.NOT_IMPLEMENTED)

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
            foto: payload.picture,
            pending: false
        })
    }

    res.json({
        _id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        foto: usuario.foto,
        token: jwtSign(usuario._id)
    })
}

export const googleHint = async (req, res) => {
    try {
        const { email } = req.query
        if (!email) return res.status(400).json({ success: false, message: "Email requerido" })

        const usuario = await userModel.findOne({ email, googleId: { $exists: true, $ne: null } })
        const showHint = Boolean(usuario)

        res.json({ success: true, showHint })
    } catch (error) {
        console.error("Error en googleHint:", error)
        res.status(500).json({ success: false, message: "Error en servidor" })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password)
        throw new AppError("Datos incompletos", HttpStatus.BAD_REQUEST)

    const usuario = await userModel.findOne({ email })
    if (!usuario)
        throw new AppError("Email o contraseña incorrectos", HttpStatus.UNAUTHORIZED)

    const validPassword = await usuario.comparePassword(password)
    if (!validPassword)
        throw new AppError("Email o contraseña incorrectos", HttpStatus.UNAUTHORIZED)

    let token = jwtSign(usuario._id, '30d')
    res.status(200).json({
        _id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        token
    })
}

export const perfilUsuario = async (req, res) => {
    if (!req.usuario) throw new AppError("Usuario no encontrado", 404);

    res.json(req.usuario);
}

export const resetPassword = async (req, res) => {
    const { email } = req.body
    if (!email) throw new AppError("El correo es requerido", HttpStatus.BAD_REQUEST)

    const user = await userModel.findOne({ email })
    if (!user) throw new AppError("Usuario no encontrado", HttpStatus.NOT_FOUND)

    const token = jwtSign(user._id, "15m")
    user.tempToken = token
    user.tempTokenExpire = new Date(Date.now() + 1 * 60 * 1000) //INFO: m, s, ms (mide ticks en ms)
    await user.save()

    const resetLink = `${process.env.APP_URL}/new-password/${token}`

    const response = await sendEmail({
        to: email,
        subject: "Restablece tu contraseña - Didacta",
        html: `
      <div style="font-family:Arial,sans-serif">
        <h3>Restablecimiento de contraseña</h3>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>Este enlace expirará en 1 minuto.</p>
      </div>
    `,
    })

    if (!response.success) {
        throw new AppError("Error enviando el correo", HttpStatus.INTERNAL_SERVER_ERROR, { error: response.error })
    }

    return res.json({ message: "📩 Correo de restablecimiento enviado" })
}

export const newPassword = async (req, res) => {
    const { token, password } = req.body

    if (!token || !password) {
        throw new AppError("Token y nueva contraseña son requeridos", HttpStatus.BAD_REQUEST)
    }

    const decodedUser = jwtVerify(token)
    const user = await userModel.findOne({ email: decodedUser.key.email })

    if (user?.tempTokenExpire && user.tempTokenExpire < new Date()) {
        user.tempToken = undefined
        user.tempTokenExpire = undefined
        await user.save()
        throw new AppError("Token vencido. Intenta reestablecer la contraseña nuevamente.", HttpStatus.BAD_REQUEST)
    }

    if (!user || user.tempToken !== token) {
        throw new AppError("Token inválido o expirado", HttpStatus.BAD_REQUEST)
    }

    if (!validatePassword(password))
        throw new AppError("Formato de contraseña inválido", HttpStatus.BAD_REQUEST);

    user.password = String(password)
    user.tempToken = undefined
    user.tempTokenExpire = undefined
    await user.save()

    res.json({ message: "✅ Contraseña actualizada correctamente." })
}

// TODO: INSERTAR HTML AL CUERPO DEL CORREO ELECTRÓNICO
export const verificationEmail = async (req, res) => {
    const { name, email, password } = req.body;

    if (!email || !name || !password)
        throw new AppError("Faltan campos obligatorios", HttpStatus.BAD_REQUEST);

    const usuario = await userModel.findOne({ email });
    if (usuario)
        throw new AppError("El usuario ya existe", HttpStatus.CONFLICT);

    if (!validateEmail(email))
        throw new AppError("Formato de correo inválido", HttpStatus.BAD_REQUEST);

    if (!validatePassword(password))
        throw new AppError("Formato de contraseña inválido", HttpStatus.BAD_REQUEST);

    const code = Math.floor(10000 + Math.random() * 90000).toString();

    await userModel.create({ email, pending: true, name, password, tempToken: code, tempTokenExpire: Date.now() + 1 * 60 * 1000 });

    const sendVerifEmail = await sendEmail({
        to: email,
        subject: "Código de verificación Didacta",
        text: `Tu código de verificación es: ${code}`,
    });

    if (!sendVerifEmail.success)
        throw new AppError("Error al enviar el correo", HttpStatus.INTERNAL_SERVER_ERROR);

    res.json({ success: true, message: "📩 Código de verificación enviado a tu correo" });
}

export const register = async (req, res) => {
    const { email, code } = req.body
    if (!email || !code)
        throw new AppError("Datos incompletos", HttpStatus.BAD_REQUEST);

    const usuario = await userModel.findOne({ email: email, tempToken: code, pending: true });
    if (!usuario)
        throw new AppError("No hay código pendiente para este correo", HttpStatus.BAD_REQUEST);

    if (usuario.tempToken !== code)
        throw new AppError("Código incorrecto", HttpStatus.BAD_REQUEST);

    usuario.pending = false;
    usuario.tempToken = undefined;
    usuario.tempTokenExpire = undefined;
    let token = jwtSign(usuario._id, "30d");
    usuario.save()

    res.status(HttpStatus.CREATED).json({
        success: true,
        _id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        token
    });
}