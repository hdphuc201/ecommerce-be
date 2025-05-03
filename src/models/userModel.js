import mongoose from "mongoose";

// Định nghĩa schema cho người dùng

const addressSchema = new mongoose.Schema({
  houseNumber: {
    type: String,
    required: [true, "Số nhà không hợp lệ hoặc thiếu"],
  },
  district: { type: String, required: [true, "Quận không hợp lệ hoặc thiếu"] },
  city: { type: String, required: [true, "Thành phố không hợp lệ hoặc thiếu"] },
  defaultAddress: { type: Boolean, default: false }, // Mặc định là false
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Tên không hợp lệ"] },
    email: {
      type: String,
      required: [true, "Email không hợp lệ"],
      unique: true,
      lowercase: true,
      trim: [true, "Email không được bỏ trống"],
      validate: {
        validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Email không đúng định dạng",
      },
    },
    phone: { type: String },
    password: {
      type: String,
      required: [true, "Mật khẩu không hợp lệ"],
      minlength: [6, "Mật khẩu ít nhất 6 ký tự"],
    },
    avatar: { type: String },
    address: [addressSchema],
    googleId: { type: String },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isLogin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Tạo model từ schema
const User = mongoose.model("User", userSchema);

export default User;
