import Category from "~/models/categoryModel";
import Order from "~/models/orderModel";
import Product from "~/models/productModel";
import { productService } from "~/services/productService";
import removeVietnameseTones from "~/utils/removeVietnameseTones";

const createOrder = async (req, res, next) => {
  try {
    const {
      user,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const order = new Order({
      user,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
};

export const orderController = {
  createOrder,
};
