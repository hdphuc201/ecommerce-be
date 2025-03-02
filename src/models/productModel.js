import mongoose from "mongoose";
import removeVietnameseTones from "~/utils/removeVietnameseTones";

// Định nghĩa schema cho người dùng
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    categories: { type: Number, required: true },
    slugName: { type: String, required: false, index: true },
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
productSchema.pre("save", async function (next) {
  console.log("Middleware pre('save') được gọi:", this.name);

  if (this.isModified("name") || this.isNew) {
    let baseSlug = removeVietnameseTones(this.name)
      .trim()
      .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu '-'
      .replace(/[^a-zA-Z0-9-]/g, "") // Xóa ký tự đặc biệt
      .toLowerCase();

    let slug = baseSlug;
    let count = 1;

    // Đảm bảo slug không bị trùng lặp
    while (await this.constructor.exists({ slugName: slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    this.slugName = slug;
  }
  next();
});


const Product = mongoose.model("Product", productSchema);
export default Product;
