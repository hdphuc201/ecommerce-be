import mongoose from "mongoose";

// Định nghĩa schema cho người dùng
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    avatar: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
