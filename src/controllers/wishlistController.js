import { StatusCodes } from "http-status-codes";

import Wishlist from "~/models/wishlistModel";

const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate("products");
    console.log('wishlist', wishlist)
    if (!wishlist) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Danh sách yêu thích trống" });
    }
    res.status(StatusCodes.OK).json({ success: true, wishlist });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Lỗi server", error });
  }
};

const addWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Không có sản phẩm" });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (wishlist) {
      const isExists = wishlist.products.some(
        (id) => id.toString() === productId
      );
      if (isExists) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: "Sản phẩm đã có trong danh sách" });
      }

      wishlist.products.push(productId);
      await wishlist.save();
    } else {
      wishlist = await Wishlist.create({
        userId: req.user._id,
        products: [productId],
      });
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Đã thêm vào danh mục yêu thích" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Lỗi server", error });
  }
};


const deleteWishlist = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Sản phẩm bắt buộc" });
    }

    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist || !wishlist.products.some(p => p.toString() === productId)) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Sản phẩm không có trong yêu thích" });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );
    await wishlist.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Lỗi server", error });
  }
};

export const wishlistController = {
  getWishlist,
  addWishlist,
  deleteWishlist,
};
