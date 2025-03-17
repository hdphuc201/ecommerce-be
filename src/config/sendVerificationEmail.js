// Gửi email qua Nodemailer
import nodemailer from "nodemailer"; // ✅ Chuẩn ES6 module
import { env } from "./environment";

export const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // hoặc dịch vụ SMTP khác
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: env.EMAIL_USER,
    to: email,
    subject: "Xác thực đăng ký tài khoản",
    html: `
      <p>Xin chào,</p>
      <p>Mã xác thực của bạn là: <b>${code}</b></p>
      <p>Mã có hiệu lực trong <b>10 phút</b>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
      <p>Trân trọng,</p>
    `,
  });
};
