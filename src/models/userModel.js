import mongoose from "mongoose";

// Định nghĩa schema cho người dùng

const addressSchema = new mongoose.Schema({
  houseNumber: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  defaultAddress: { type: Boolean, default: false }, // Mặc định là false
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String },
    avatar: { type: String },
    address: [addressSchema],
    googleId: { type: String },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isLogin: { type: Boolean, default: false },
    logoutDevice: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
