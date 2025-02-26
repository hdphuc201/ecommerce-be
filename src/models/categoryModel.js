const mongoose = require("mongoose");

// Định nghĩa schema cho người dùng
const categorySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

const categoryModel = mongoose.model("Category", categorySchema);
export default categoryModel;
