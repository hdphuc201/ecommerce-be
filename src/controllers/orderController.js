import mongoose from "mongoose";
import { sendInforOrderEmail, sendVerificationEmail } from "~/config/sendEmail";
import Cart from "~/models/cartModel";
import Order from "~/models/orderModel";
import User from "~/models/userModel";

const getOrder = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const listOrder = await Order.find({ userId: userId });

    if (listOrder) {
      return res.status(201).json(listOrder);
    }
  } catch (error) {
    res.status(500).json(error);
  }
};
const getOrderAdmin = async (req, res, next) => {
  try {
    const { id } = req.query;
    // const isArray = Array.isArray(id) ? id : [id];
    const listOrder = await Order.find({ userId: id });

    if (listOrder) {
      return res.status(201).json(listOrder);
    }
  } catch (error) {
    res.status(500).json(error);
  }
};
const applyDiscount = (subtotal, discountCode, shippingFee) => {
  let discountAmount = 0;

  // Kiểm tra mã giảm giá và tính toán giảm giá
  if (discountCode === "KHUYENMAI30") {
    discountAmount = (subtotal * 30) / 100; // Giảm giá 30%
  } else if (discountCode === "KHUYENMAI10") {
    discountAmount = (subtotal * 10) / 100; // Giảm giá 10%
  }

  // Đảm bảo rằng tổng tiền không âm
  const newSubtotal = Math.max(0, subtotal - discountAmount) + shippingFee;

  return newSubtotal;
};

const createOrder = async (req, res, next) => {
  try {
    const { name, email, phone, ...orders } = req.body;
    let userId = orders?.userId || null;

    if (!orders.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Cập nhật địa chỉ",
      });
    }

    if (userId === null) {
      const validators = {
        name: (val) => typeof val === "string" && val.trim() !== "",
        email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        phone: (val) => /^\d{10}$/.test(val),
      };

      for (const field in validators) {
        if (!validators[field](req.body[field])) {
          return res.status(400).json({
            success: false,
            message: `${field} không hợp lệ hoặc thiếu`,
          });
        }
      }

      const checkUser = await User.findOne({ email });
      if (!checkUser) {
        const createUser = await User.create({ name, email, phone });
        userId = createUser._id;
      } else {
        userId = checkUser._id;
      }
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "User ID không hợp lệ" });
    }
    orders.userId = userId;
    const shippingFee = orders.shippingFee || 0; // Mặc định phí vận chuyển luôn có

    // Kiểm tra mã giảm giá (nếu có)
    if (orders.discount || orders.shippingFee) {
      if (["GIAM30", "GIAM10"].includes(orders.discount)) {
        // Nếu mã giảm giá hợp lệ, áp dụng giảm giá
        orders.subTotal = applyDiscount(
          orders.subTotal,
          orders.discount,
          shippingFee
        );
      } else {
        // Nếu mã giảm giá không hợp lệ
        return res.status(400).json({ message: "Mã giảm giá không hợp lệ" });
      }
    } else {
      orders.subTotal += shippingFee;
    }

    // ✅ Lưu đơn hàng vào database
    const order = new Order(orders);
    const createdOrder = await order.save();

    // ✅ Kiểm tra giỏ hàng có tồn tại không
    const cart = await Cart.findOne({ userId: orders?.userId });

    if (cart) {
      // Nếu có giỏ hàng → Cập nhật giỏ hàng
      const listProductOrderd = createdOrder?.orderItems.map((item) =>
        item._id.toString()
      );

      for (const productId of listProductOrderd) {
        const productIndex = cart?.listProduct.findIndex(
          (product) => product?._id?.toString() === productId.toString()
        );

        if (productIndex !== -1) {
          const removedProduct = cart.listProduct.splice(productIndex, 1)[0];
          cart.totalProduct -= 1;
          cart.subTotal -= removedProduct.quantity * removedProduct.price;
        }
      }
      await cart.save();
    }

    // ✅ Gửi email xác nhận
    await sendInforOrderEmail(email, createdOrder);

    return res.status(200).json({
      success: true,
      message: `Đặt hàng thành công${
        !req.body._id ? ", theo dõi đơn hàng qua Email " : ""
      }`,
      createdOrder,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const orderController = {
  getOrder,
  getOrderAdmin,
  createOrder,
};
