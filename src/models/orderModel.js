import { model, Schema, Types } from "mongoose";

// Định nghĩa schema cho từng sản phẩm trong đơn hàng
const orderItemSchema = new Schema({
  productId: {
    type: Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
});

// Định nghĩa schema cho đơn hàng
const orderSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    }, // Tham chiếu đến User
    code: { type: Number, required: true },
    orderItems: [orderItemSchema],
    totalProduct: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: { type: String, default: "" },
    discountPrice: { type: Number, default: 0 },
    shippingAddress: {
      houseNumber: { type: String, required: true },
      district: { type: String, required: true },
      city: { type: String, required: true },
      defaultAddress: { type: Boolean, default: false },
    },
    deliveryMethod: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    trackingNumber: { type: String, default: "" },
    isPaid: { type: Boolean, default: false },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "fullfilled" },
  },
  { timestamps: true }
);

// Tạo model cho đơn hàng
const Order = model("Order", orderSchema);

export default Order;
