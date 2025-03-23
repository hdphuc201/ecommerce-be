// Gửi email qua Nodemailer
import nodemailer from "nodemailer"; // ✅ Chuẩn ES6 module
import { env } from "./environment";
import { formattedDate } from "~/utils/formatDate";

const formatNumber = (number) => number?.toLocaleString("de-DE");

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

export const sendInforOrderEmail = async (email, ordered) => {
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
    subject: "Thông tin đơn hàng của bạn",
    html: `
        <div>
          <p>
              <strong>Ngày đặt:</strong> ${formattedDate(ordered?.createdAt)}
          </p>
          <p>
              <strong>Phương thức giao hàng:</strong> ${ordered?.deliveryMethod}
          </p>
          <p>
              <strong>Phương thức thanh toán:</strong> ${ordered?.paymentMethod}
          </p>

          <p>
              <strong>Số lượng sản phẩm:</strong> ${ordered?.totalProduct}
          </p>
          <p>
              <strong>Tổng tiền:</strong> ${
                formatNumber(ordered?.subTotal) || 0
              }
          </p>
          <p className="mt-3">
              <strong>Sản phẩm:</strong>
          </p>
          <ul>
              ${ordered?.orderItems?.map(
                (item, index) =>
                  `<li
                  key=${item?._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <img
                    src=${item?.image}
                    alt="Product"
                    style={{
                      width: "70px",
                      height: "70px",
                      marginRight: "10px",
                    }}
                  />
                  <div>
                    <p>${item?.name}</p>
                    <p>
                      ${formatNumber(item?.price)} x ${item?.quantity || 0}
                    </p>
                  </div>
                </li>`
              )}
          </ul>
      </div>
    `,
  });
};
