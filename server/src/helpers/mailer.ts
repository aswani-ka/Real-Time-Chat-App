import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_SMTP_HOST,
  port: Number(process.env.MAILTRAP_SMTP_PORT),
  auth: {
    user: process.env.MAILTRAP_SMTP_USER,
    pass: process.env.MAILTRAP_SMTP_PASS,
  },
});

/* ================= SEND PASSWORD RESET MAIL ================= */

export const sendResetPasswordMail = async (
  to: string,
  name: string,
  resetLink: string
) => {
  await transporter.sendMail({
    from: `"ChatApp Support" <no-reply@chatapp.com>`,
    to,
    subject: "Reset Your ChatApp Password",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px;">
        
        <div style="background:#4f46e5; padding:20px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">ChatApp</h1>
          <p style="color:#e0e7ff;">Secure Account Access</p>
        </div>

        <div style="padding:30px; color:#333;">
          <h2>Reset Your Password</h2>

          <p>Hello <strong>${name}</strong>,</p>

          <p>
            We received a request to reset your password.
            Click the button below to continue.
          </p>

          <div style="text-align:center; margin:30px 0;">
            <a href="${resetLink}"
              style="
                background:#4f46e5;
                color:#ffffff;
                padding:14px 28px;
                border-radius:6px;
                text-decoration:none;
                font-weight:bold;
                display:inline-block;
              ">
              Reset Password
            </a>
          </div>

          <p style="font-size:14px;">
            This link will expire in <strong>15 minutes</strong>.
          </p>

          <p style="font-size:14px;">
            If you did not request this, please ignore this email.
          </p>

          <hr style="margin:30px 0;" />

          <p style="font-size:12px; color:#777;">
            Or copy and paste this link into your browser:
            <br/>
            <a href="${resetLink}" style="color:#4f46e5;">
              ${resetLink}
            </a>
          </p>
        </div>

        <div style="background:#f9fafb; padding:15px; text-align:center;">
          <p style="font-size:12px; color:#888;">
            © ${new Date().getFullYear()} ChatApp
          </p>
        </div>
      </div>
    </div>
    `,
  });
};
