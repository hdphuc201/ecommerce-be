import { model, Schema, Types } from "mongoose";

const wishlishSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: Types.ObjectId,
          ref: "Product",
          required: true,
        },
        type: Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Wishlist = model("Wishlist", wishlishSchema);
export default Wishlist;
