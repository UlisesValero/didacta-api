import { Resend } from "resend";

// NECESARIO ¿?
export const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Falta la API key de Resend en process.env")
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const resend = getResend()
    const data = await resend.emails.send({
      from: "Didacta <AGREGAR DOMINIO DIDACTA>",
      to,
      subject,
      text,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error enviando correo:", error)
    return { success: false, error }
  }
}
