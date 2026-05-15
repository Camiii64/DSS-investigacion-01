// ==========================================
// 📧 SERVICIO DE CORREOS (Nodemailer + Gmail)
// ==========================================
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Verifica al arrancar que las credenciales sean válidas (no bloquea el server)
if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  transporter.verify((err) => {
    if (err) console.error("❌ Mailer no pudo conectarse:", err.message);
    else console.log("✅ Mailer listo para enviar correos");
  });
} else {
  console.warn("⚠️  MAIL_USER o MAIL_PASS no definidos. Los correos no se enviarán.");
}

/**
 * Envía un correo. Si falla, registra el error pero NO lanza —
 * para que un fallo de SMTP nunca rompa una petición HTTP.
 */
async function enviarCorreo({ to, subject, html }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn("Mailer deshabilitado: faltan credenciales.");
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`📨 Correo enviado a ${to} (id: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Error enviando correo a ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

// ==========================================
// 🎨 PLANTILLAS DE CORREO
// ==========================================

function plantillaCodigoEmergencia({ nombre, codigo, doctorNombre }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1e293b;">
      <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="text-align:center; margin-bottom: 24px;">
          <div style="display:inline-block; background:#006B76; color:#fff; padding: 12px 16px; border-radius: 12px; font-weight: 800; letter-spacing: 0.5px;">
            🏥 MediConnect
          </div>
        </div>
        <h2 style="color: #006B76; margin: 0 0 12px;">Hola, ${nombre}</h2>
        <p style="color: #475569; line-height: 1.6;">
          Tu solicitud de atención de emergencia fue registrada exitosamente.
          Un doctor ya fue asignado a tu caso.
        </p>
        <div style="background: linear-gradient(135deg, #fee2e2, #fef3c7); border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; font-weight: 800; color: #b91c1c; letter-spacing: 2px; text-transform: uppercase;">
            Tu código de acceso
          </p>
          <p style="margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #b91c1c; font-family: 'Courier New', monospace;">
            ${codigo}
          </p>
        </div>
        <p style="color: #475569; line-height: 1.6; font-size: 14px;">
          <strong>Doctor asignado:</strong> ${doctorNombre}<br/>
          <strong>Validez del código:</strong> Hasta 3 usos
        </p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-top: 24px;">
          Guarda este código. Si pierdes la sesión, podrás recuperar el acceso a tu perfil
          ingresándolo en la pantalla de login.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          Este es un correo automático. No respondas a este mensaje.
        </p>
      </div>
    </div>
  `;
}

function plantillaResetPassword({ nombre, codigo }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #f8fafc; color: #1e293b;">
      <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <div style="text-align:center; margin-bottom: 24px;">
          <div style="display:inline-block; background:#006B76; color:#fff; padding: 12px 16px; border-radius: 12px; font-weight: 800;">
            🔐 MediConnect
          </div>
        </div>
        <h2 style="color: #006B76; margin: 0 0 12px;">Hola, ${nombre}</h2>
        <p style="color: #475569; line-height: 1.6;">
          Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código
          para continuar con el proceso:
        </p>
        <div style="background: #E0F5F7; border: 2px solid #B2E5E8; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; font-weight: 800; color: #006B76; letter-spacing: 2px; text-transform: uppercase;">
            Código de recuperación
          </p>
          <p style="margin: 0; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #006B76; font-family: 'Courier New', monospace;">
            ${codigo}
          </p>
        </div>
        <p style="color: #475569; line-height: 1.6; font-size: 14px;">
          Este código expira en <strong>15 minutos</strong>.<br/>
          Si no solicitaste esto, ignora este correo. Tu contraseña actual seguirá funcionando.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          Este es un correo automático. No respondas a este mensaje.
        </p>
      </div>
    </div>
  `;
}

module.exports = {
  enviarCorreo,
  plantillaCodigoEmergencia,
  plantillaResetPassword,
};
