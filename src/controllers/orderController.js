import Cart from "~/models/cartModel";
import Order from "~/models/orderModel";

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
const applyDiscount = (subtotal, discountCode) => {
  let discountAmount = 0;

  // Kiểm tra mã giảm giá và tính toán giảm giá
  if (discountCode === "KHUYENMAI30") {
    discountAmount = (subtotal * 30) / 100; // Giảm giá 30%
  } else if (discountCode === "KHUYENMAI10") {
    discountAmount = (subtotal * 10) / 100; // Giảm giá 10%
  }

  // Tính lại subtotal sau khi áp dụng giảm giá
  const newSubtotal = subtotal - discountAmount;

  return newSubtotal;
};

const createOrder = async (req, res, next) => {
  try {
    const orders = req.body;
    const userId = req.user?._id;

    // Kiểm tra mã giảm giá (nếu có)
    if (orders.discount) {
      if (["GIAM30", "GIAM10"].includes(orders.discount)) {
        // Nếu mã giảm giá hợp lệ, áp dụng giảm giá
        orders.subTotal = applyDiscount(orders.subTotal, orders.discount);
      } else {
        // Nếu mã giảm giá không hợp lệ
        return res.status(400).json({ message: "Mã giảm giá không hợp lệ" });
      }
    }

    const order = new Order(orders);
    const createdOrder = await order.save();

    const cart = await Cart.findOne({ userId: userId });
    if (createdOrder) {
      const listProductOrderd = createdOrder.orderItems.map((item) =>
        item._id.toString()
      );

      for (const productId of listProductOrderd) {
        const productIndex = cart?.listProduct.findIndex(
          (product) => product?._id.toString() === productId
        );
        if (productIndex === -1) {
          return res
            .status(400)
            .json({ message: "Sản phẩm không có trong giỏ hàng" });
        }

        const removedProduct = cart.listProduct.splice(productIndex, 1)[0];

        cart.totalProduct -= 1;
        cart.subTotal -= removedProduct.quantity * removedProduct.price;
      }

      await cart.save();

      return res
        .status(201)
        .json({ success: true, message: "Đặt hàng thành công", createdOrder });
    }
  } catch (error) {
    next(error);
  }
};

export const orderController = {
  getOrder,
  getOrderAdmin,
  createOrder,
};
