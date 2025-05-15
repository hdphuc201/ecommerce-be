import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import { sendInforOrderEmail } from "~/config/sendEmail";
import Cart from "~/models/cartModel";
import Discount from "~/models/discountModel";
import Order from "~/models/orderModel";
import User from "~/models/userModel";

const getOrder = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Không xác định được người dùng",
      });
    }

    const listOrder = await Order.find({ userId });

    return res.status(StatusCodes.OK).json(listOrder);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

const getOrderAdmin = async (req, res, next) => {
  try {
    const { id, page, limit, status, code } = req.query;
    const offset = (page - 1) * limit;
    // Xác thực page và limit để đảm bảo chúng là các số nguyên dương
    if (page <= 0 || limit <= 0) {
      return {
        success: false,
        message: "Page và limit phải là các số nguyên dương",
      };
    }

    const filterObj = {};

    if (status) filterObj.status = status;
    if (code) filterObj.code = code;

    if (!id) {
      const totalOrders = await Order.countDocuments();
      const orders = await Order.find(filterObj || {});
      return res.status(StatusCodes.OK).json({
        success: true,
        data: orders,
        total: totalOrders,
      });
    }

    const totalOrders = await Order.countDocuments({ userId: id });
    const orders = await Order.find({ userId: id, ...filterObj })
      .limit(limit || 4)
      .skip(offset);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: offset >= totalOrders ? [] : orders,
      total: totalOrders,
      currentPage: page,
      totalPage: Math.ceil(totalOrders / limit),
      length: offset >= totalOrders ? 0 : orders.length,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

const createOrder = async (req, res) => {
  try {
    const { name, email, phone, ...orderData } = req.body;
    let userId = orderData.userId || null;

    // 1. Kiểm tra địa chỉ
    if (!orderData.shippingAddress) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Cập nhật địa chỉ" });
    }

    // 2. Nếu chưa có userId (chưa đăng nhập) → tạo/tìm user ẩn danh
    if (!userId) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isValidPhone = /^\d{10}$/.test(phone);

      if (!name) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Tên không hợp lệ",
        });
      }
      if (!isValidEmail) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }
      if (!isValidPhone) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Số điện thoại không hợp lệ",
        });
      }

      const existingUser = await User.findOne({ email });
      userId =
        existingUser?._id || (await User.create({ name, email, phone }))._id;
    }

    // 3. Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "User ID không hợp lệ" });
    }

    orderData.userId = userId;

    // 4. Tính lại tổng phụ
    const subTotal = orderData.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 5. Kiểm tra mã giảm giá
    let discountAmount = 0;
    if (orderData.discount) {
      const discount = await Discount.findOne({ code: orderData.discount });

      if (!discount)
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Mã giảm giá không hợp lệ" });

      discountAmount =
        discount.type === "percent"
          ? subTotal * (discount.value / 100)
          : discount.value;

      if (orderData.discountPrice !== discountAmount) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Số tiền giảm chưa chính xác" });
      }

      // Trừ số lần dùng và vô hiệu nếu hết lượt
      discount.usageLimit -= 1;
      discount.usedCount += 1;
      if (discount.usageLimit <= 0) {
        discount.isActive = false;
        discount.usageLimit = 0;
      }
      await discount.save();
    }

    // 6. Kiểm tra tổng giá trị
    const totalPrice = subTotal - discountAmount + orderData.shippingFee;

    if (orderData.totalPrice !== totalPrice) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Tổng tiền tính chưa chính xác" });
    }

    if (orderData.subTotal !== subTotal) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Tạm tính chưa chính xác" });
    }

    let code;
    do {
      code = Math.floor(1000 + Math.random() * 90000);
    } while (await Order.exists({ code }));
    orderData.code = code;

    // 7. Lưu đơn hàng
    const order = new Order(orderData);
    const createdOrder = await order.save();

    // 8. Cập nhật giỏ hàng nếu có
    const cart = await Cart.findOne({ userId });
    if (cart) {
      const orderedIds = createdOrder.orderItems.map((item) =>
        item._id.toString()
      );
      cart.listProduct = cart.listProduct.filter((product) => {
        const matched = orderedIds.includes(product._id.toString());
        if (matched) {
          cart.totalProduct -= 1;
          cart.subTotal -= product.price * product.quantity;
        }
        return !matched;
      });
      await cart.save();
    }

    // 9. Gửi email
    await sendInforOrderEmail(email, createdOrder);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đặt hàng thành công!",
      createdOrder,
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Lỗi server", error });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { ids } = req.query;
    const orderIds = ids.split(",");
    const orders = await Order.find({ _id: { $in: orderIds } });
    if (orders.length !== orderIds.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Một số đơn hàng không tồn tại",
      });
    }
    await Order.updateMany({ _id: { $in: orderIds } }, { status: "cancelled" });
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đơn hàng đã được hủy",
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Lỗi server", error });
  }
};

export const orderController = {
  getOrder,
  getOrderAdmin,
  createOrder,
  cancelOrder,
};
