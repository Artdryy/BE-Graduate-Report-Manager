import nodemailer from 'nodemailer';
import { envValues } from '../config/envSchema.js';

const transporter = nodemailer.createTransport({
  host: envValues.EMAIL_HOST,
  port: envValues.EMAIL_PORT,
  secure: envValues.EMAIL_SECURE, 
  auth: {
    user: envValues.EMAIL_USER, 
    pass: envValues.EMAIL_PASS, 
  },
});

class EmailService {
  async sendPasswordResetEmail(to, code) {
    try {
      const mailOptions = {
        from: `"Repositorio de Residencias" <${envValues.EMAIL_USER}>`,
        to: to,
        subject: 'Código de Recuperación de Contraseña',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Recuperación de Contraseña</h2>
            <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${code}
            </p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <hr>
            <p style="font-size: 12px; color: #777;">Este es un correo generado automáticamente, por favor no respondas.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Correo de recuperación enviado exitosamente:', info.messageId);
    } catch (error) {
      console.error('Error al enviar el correo de recuperación:', error);
    }
  }
}

export default new EmailService();