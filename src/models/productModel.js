import { model, Schema } from "mongoose";

import removeVietnameseTones from "~/utils/removeVietnameseTones";

const productSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    image: [{ type: Schema.Types.Mixed, required: true }], // Chấp nhận bất kỳ object nào
    categories: { type: Number, required: true },
    slugName: { type: String, required: false, index: true },
    price: { type: Number, required: true },
    price_old: { type: Number, required: true },
    countInstock: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    description: { type: String, required: true },
    sold: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);
productSchema.pre("save", async function (next) {
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

const Product = model("Product", productSchema);
export default Product;
