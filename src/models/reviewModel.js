import { model, Schema, Types } from 'mongoose';

const reviewSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, required: true },
    images: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

const Review = model("Review", reviewSchema);
export default Review;
