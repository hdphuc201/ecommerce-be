const mongoose = require("mongoose");

// Định nghĩa schema cho người dùng
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    categories: { type: Number, required: true },
    price: { type: Number, required: true },
    price_old: { type: Number, required: true },
    countInstock: { type: Number, required: true },
    rating: { type: Number, required: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const productModel = mongoose.model("Product", productSchema);
export default productModel;
