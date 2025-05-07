import { model, Schema, Types } from "mongoose";

const cartSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  listProduct: [
    {
      productId: {
        type: Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: { type: String, required: true },
      price: { type: Number, required: true }, // Lưu giá tại thời điểm thêm vào giỏ hàng
      quantity: { type: Number, required: true, min: 1 },
      image: { type: String, required: true }, // Chỉ lưu URL ảnh chính
      countInstock: { type: Number, required: true },
    },
  ],
  totalProduct: { type: Number, default: 0 }, // Tổng số lượng sản phẩm
  subTotal: { type: Number, default: 0 }, // Tổng giá trị đơn hàng
});

const Cart = model("Cart", cartSchema);
export default Cart;
