import { model, Schema, Types } from "mongoose";

import removeVietnameseTones from "~/utils/removeVietnameseTones";

const productSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    image: [{ type: Schema.Types.Mixed, required: true }],
    code: { type: Number, required: true },

    // Gắn với 1 category (cha hoặc con)
    categories: {
      type: Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    slugName: { type: String, index: true },
    price: { type: Number, required: true },
    price_old: { type: Number, required: true },
    countInstock: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    description: { type: String, required: true },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Tạo slug trước khi lưu
productSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isNew) {
    let baseSlug = removeVietnameseTones(this.name)
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toLowerCase();

    let slug = baseSlug;
    let count = 1;

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
