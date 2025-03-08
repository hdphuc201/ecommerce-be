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
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    avatar: { type: String },
    address: [addressSchema],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
