import { OAuth2Client } from 'google-auth-library'
import { userModel } from '../../models/User.model.js'
import { validateEmail, validatePassword } from '../../utils/validation.utils.js'
import { sendEmail } from "../../utils/resend.utils.js";
import { AppError, HttpStatus, jwtSign } from '../../utils/miscellaneous.utils.js'

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
    const { email } = req.body
    const exists = await userModel.findOne({ email })
    if (!exists) throw new AppError('No se encontró un email registrado', HttpStatus.BAD_REQUEST, { exists: false })
    res.json({ exists: !!exists })
}

export const login = async (req, res) => {
    const { email, password } = req.body

    const usuario = await userModel.findOne({ email })
    if (!usuario || !(await usuario.comparePassword(password)))
        throw new AppError('Email o contraseña incorrectos', HttpStatus.UNAUTHORIZED)

    res.status(200).json({
        _id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        token: jwtSign(usuario._id, '30d')
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

    const token = jwtSign(email, '15m')
    user.tempToken = token
    await user.save()

    // TODO: TESTEAR
    const resetLink = process.env.APP_URL + `/new-password/${token}`

    const response = await sendEmail({
        to: email,
        subject: "Restablece tu contraseña - Didacta",
        text: `Haz click en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
        html: `
        <div style="font-family:Arial,sans-serif">
          <h3>Restablecimiento de contraseña</h3>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
          <p>Este enlace expirará en 15 minutos.</p>
        </div>
      `,
    })

    //INFO guard clause siempre. se invierten los bloques if-else para evitar anidamientos
    //antes:
    // if (response.success) {
    //     return res.json({ message: "📩 Correo de restablecimiento enviado" })
    // } else {
    //     return res.status(500).json({ message: "Error enviando el correo", error: response.error })
    // }

    //ahora:
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

    const decoded = jwtVerify(token)

    const user = await userModel.findOne({
        email: decoded.email,
        resetToken: token,
        resetTokenExpire: { $gt: Date.now() },
    })

    if (!user) {
        throw new AppError("Token inválido o expirado", HttpStatus.BAD_REQUEST)
    }

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

    //TODO: testear
    await userModel.create({ email, pending: true, name, password, tempToken: code, tempTokenExpire: Date.now() + 15 * 60 * 1000 });

    // if (pending) {
    //     pending.tempToken = code;
    //     pending.name = name;
    //     pending.password = password;
    //     await pending.save();
    // } else {
    //     await tempCodeModel.create({ email, code, name, password });
    // }

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

    const { email, code } = req.body;

    if (!email || !code)
        throw new AppError("Datos incompletos", HttpStatus.BAD_REQUEST);

    const usuario = await userModel.findOne({ email, code: code, pending: true });

    if (!usuario)
        throw new AppError("No hay código pendiente para este correo", HttpStatus.BAD_REQUEST);

    if (usuario.code !== code)
        throw new AppError("Código incorrecto", HttpStatus.BAD_REQUEST);

    usuario.pending = false;
    usuario.token = jwtSign(newUser._id, "30d");

    res.status(HttpStatus.CREATED).json({
        success: true,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        token,
    });
};