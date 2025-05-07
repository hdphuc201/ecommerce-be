import { model, Schema } from "mongoose";

// Định nghĩa schema cho người dùng

const addressSchema = new Schema({
  houseNumber: {
    type: String,
    required: true,
  },
  district: { type: String, required: true },
  city: { type: String, required: true },
  defaultAddress: { type: Boolean, default: false }, // Mặc định là false
});

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: { type: String },
    password: { type: String },
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
const User = model("User", userSchema);

export default User;
