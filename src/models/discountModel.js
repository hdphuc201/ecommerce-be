import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["percent", "fixed"], // percent = %, fixed = tiền cố định
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0, // Giá trị đơn hàng tối thiểu để áp dụng mã
    },
    usageLimit: {
      type: Number,
      default: 999, // Số lần được sử dụng
    },
    usedCount: {
      type: Number,
      default: 0, // Số lần đã sử dụng
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
