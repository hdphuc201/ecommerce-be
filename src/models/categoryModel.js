import { model, Schema } from "mongoose";

// Định nghĩa schema cho người dùng
const categorySchema = new Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

const Category = model("Category", categorySchema);
export default Category;
