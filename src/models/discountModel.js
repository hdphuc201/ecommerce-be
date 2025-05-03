import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Mã giảm giá là bắt buộc"],
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: (val) => /^[A-Z0-9]+$/.test(val),
        message:
          "Mã giảm giá chỉ bao gồm chữ in hoa và số, không ký tự đặc biệt",
      },
    },
    description: {
      type: String,
      required: [true, "Mô tả là bắt buộc"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["percent", "fixed"],
        message: "Loại phải là 'percent' hoặc 'fixed'",
      },
      required: [true, "Loại giảm giá là bắt buộc"],
    },
    value: {
      type: Number,
      required: [true, "Giá trị là bắt buộc"],
      validate: {
        validator: function (val) {
          if (this.type === "percent") return val >= 0 && val <= 100;
          if (this.type === "fixed") return val > 0;
          return false;
        },
        message: function () {
          if (this.type === "percent")
            return "Phần trăm giảm giá phải từ 0 đến 100";
          if (this.type === "fixed") return "Giá trị cố định phải lớn hơn 0";
          return "Giá trị giảm giá không hợp lệ";
        },
      },
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: 999,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu là bắt buộc"],
    },
    endDate: {
      type: Date,
      required: [true, "Ngày kết thúc là bắt buộc"],
      validate: {
        validator: function (val) {
          return this.startDate && val > this.startDate;
        },
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
