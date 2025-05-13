// models/category.model.ts
import { model, Schema, Types } from 'mongoose';

const categorySchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    parent: {
      type: Types.ObjectId,
      ref: 'Category',
      default: null, // null tức là danh mục cha
    },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category = model('Category', categorySchema);
export default Category;
