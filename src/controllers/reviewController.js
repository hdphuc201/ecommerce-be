// src/controllers/review.controller.js
import cloudinary from "~/config/cloudinary";
import { extractPublicIdFromUrl } from "~/config/extractPublicId";
import { handleMultipleImageUploadBuffer } from "~/config/multer";
import Product from "~/models/productModel";
import Review from "~/models/reviewModel.js";
import User from "~/models/userModel";

/**
 * POST /api/reviews/:productId
 * Thêm review mới
 */
const addReview = async (req, res, next) => {
  const removedImages = JSON.parse(req.body.removedImages || "[]");
  let unchangedImages = JSON.parse(req.body.unchangedImages || "[]");

  if (removedImages.length > 0) {
    try {
      const publicIds = removedImages
        .map(extractPublicIdFromUrl)
        .filter(Boolean);
      await removeImagesFromCloudinary(publicIds);
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Không thể xóa ảnh", error });
    }
  }

  try {
    const { userId, productId, rating, comment, orderId } = req.body;
    const { files } = req;

    const { avatar, name } = await User.findById(req.user._id);

    let newImagePaths = [];
    if (files) {
      newImagePaths = await handleMultipleImageUploadBuffer(files, "reviews");
    }
    const allImages = [...unchangedImages, ...newImagePaths];

    const existed = await Review.findOne({ productId, orderId, userId });

    if (existed) {
      const now = new Date();
      const diffTime = now - existed.createdAt;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays > 3) {
        return res.status(400).json({
          success: false,
          message: "Quá hạn sửa đánh giá (sau 3 ngày)",
        });
      }

      await Review.findByIdAndUpdate(existed._id, {
        rating,
        comment,
        images: allImages,
        userName: name,
        userAvatar: avatar,
      });
    } else {
      await Review.create({
        ...req.body,
        userName: name,
        userAvatar: avatar,
        images: allImages,
      });
    }

    // Cập nhật lại rating trung bình
    const allReviews = await Review.find({ productId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    const product = await Product.findById(productId);
    product.rating = avgRating;
    await product.save();

    return res.status(201).json({
      success: true,
      message: existed ? "Đã cập nhật đánh giá" : "Đánh giá thành công!",
    });
  } catch (err) {
    next(err);
  }
};
const removeImagesFromCloudinary = async (publicIds) => {
  for (let publicId of publicIds) {
    try {
      // Gọi API Cloudinary để xóa ảnh
      cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Lỗi khi xóa ảnh ${publicId}`);
    }
  }
};

/**
 * GET /api/reviews/:productId
 * Lấy review theo product
 */
const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find().sort("-createdAt");

    // Group theo productId và trả về mảng
    const groupedMap = reviews.reduce((acc, cur) => {
      const pid = cur.productId.toString();
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(cur);
      return acc;
    }, {});

    // Chuyển từ object thành array
    const groupedReviews = Object.keys(groupedMap).map((pid) => ({
      productId: pid,
      reviews: groupedMap[pid],
    }));

    return res.json(groupedReviews);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/reviews/:reviewId
 * Chỉ owner mới sửa được
 */
const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy review" });
    }
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Không có quyền sửa" });
    }

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    review.images = images ?? review.images;
    await review.save();

    return res.json(review);
  } catch (err) {
    next(err);
  }
};

const deleteAllReviews = async (req, res) => {
  try {
    const result = await Review.deleteMany({});
    res.status(200).json({
      message: "Đã xóa toàn bộ review thành công.",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Lỗi khi xóa toàn bộ review:", err);
    res.status(500).json({
      message: "Xảy ra lỗi khi xóa toàn bộ review.",
      error: err.message,
    });
  }
};

export const reviewController = {
  addReview,
  getReviews,
  updateReview,
  deleteAllReviews,
};
