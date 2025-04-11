import mongoose from "mongoose";

// Định nghĩa schema cho từng sản phẩm trong đơn hàng
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
});

// Định nghĩa schema cho đơn hàng
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Tham chiếu đến User

    orderItems: [orderItemSchema], // Mảng các sản phẩm trong đơn hàng
    totalProduct: { type: Number, default: 0 }, // Tổng số lượng sản phẩm
    subTotal: { type: Number, default: 0 }, // Tổng tiền sản phẩm
    shippingFee: { type: Number, default: 0 }, // Phí vận chuyển
    discount: { type: String, default: "" }, // Mã giảm giá
    discountPrice: { type: Number, default: 0 },
    shippingAddress: {
      houseNumber: { type: String, required: true },
      district: { type: String, required: true },
      city: { type: String, required: true },
      defaultAddress: { type: Boolean, default: false },
    },
    deliveryMethod: { type: String, required: true }, // Phương thức giao hàng
    paymentMethod: { type: String, required: true }, // Phương thức thanh toán
    trackingNumber: { type: String, default: "" }, // Số theo dõi giao hàng,
    isPaid: { type: Boolean, default: false },
    totalPrice: { type: Number, required: true }, // ✅ Thêm dòng này đúng chuẩn
  },
  { timestamps: true } // Thêm các trường createdAt và updatedAt
);

// Tạo model cho đơn hàng
const Order = mongoose.model("Order", orderSchema);

export default Order;
