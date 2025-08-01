import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";

import { env } from "~/config/environment";
import { extractPublicIdFromUrl } from "~/config/extractPublicId";
import {
  handleMultipleImageUpload,
  handleMultipleImageUploadBuffer,
} from "~/config/multer";
import Category from "~/models/categoryModel";
import Product from "~/models/productModel";
import { productService } from "~/services/productService";
import removeVietnameseTones from "~/utils/removeVietnameseTones";

const createProduct = async (req, res, next) => {
  try {
    const { files } = req;
    if (!files?.length) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Thiếu ảnh sản phẩm" });
    }

    const imagePaths = await handleMultipleImageUploadBuffer(files, "products");

    let code;
    do {
      code = Math.floor(1000 + Math.random() * 9000);
    } while (await Product.exists({ code }));
    req.body.code = code;

    const validations = {
      name: (valid) => valid,
      code: (valid) => valid,
      categories: (valid) => valid,
      price: (valid) => Number(valid),
      price_old: (valid) => Number(valid),
      countInstock: (valid) => Number(valid),
      rating: (valid) => Number(valid) !== 0,
      description: (valid) => valid,
    };

    for (const item in validations) {
      if (!validations[item](req.body[item])) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `${item} thiếu hoặc sai định dạng`,
        });
      }
    }

    const result = await productService.createProduct(req.body, imagePaths);

    // ✅ Trả kết quả response ở đây
    if (!result.success) {
      return res.status(StatusCodes.BAD_REQUEST).json(result);
    }
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  const removedImages = JSON.parse(req.body.removedImages || "[]");
  let unchangedImages = JSON.parse(req.body.unchangedImages || "[]");
  const currentImages = req.files;
  if (unchangedImages.length === 0 && currentImages.length === 0) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Thêm hình ảnh khác" });
  }
  // 1. Xoá ảnh cũ nếu có
  if (removedImages.length > 0) {
    try {
      const publicIds = removedImages
        .map(extractPublicIdFromUrl)
        .filter(Boolean);
      await removeImagesFromCloudinary(publicIds);
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Không thể xóa ảnh", error });
    }
  }

  try {
    // 2. Chuẩn hoá danh sách ảnh gửi về
    // const newImagePaths = req.files.map(file => file.path); // ['uploads/products/...']
    const newImagePaths =
      env.BUILD_MODE === "dev"
        ? req.files.map((file) => file.path)
        : await handleMultipleImageUpload(req.files, "product"); // ['uploads/products/...']
    const allImages = [...unchangedImages, ...newImagePaths];
    // 3. Gộp form
    const form = {
      ...req.body,
      image: allImages,
    };

    // 4. Gửi qua service
    const updatedProduct = await productService.updateProduct(form);

    // ✅ Trả kết quả response ở đây
    if (!updatedProduct.success) {
      return res.status(StatusCodes.BAD_REQUEST).json(updatedProduct);
    }

    return res.status(StatusCodes.OK).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// Hàm xóa ảnh khỏi Cloudinary
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

const updateProductStock = async (req, res, next) => {
  try {
    const { productId, quantityOrdered } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw new Error("Sản phẩm không tồn tại");

    product.countInstock -= quantityOrdered; // Trừ số lượng
    product.sold += quantityOrdered; // Trừ số lượng

    await product.save();
    return res
      .status(StatusCodes.OK)
      .json({ message: "Cập nhật số lượng thành công" });
  } catch (error) {
    next(error);
  }
};

const getAllCategoryIds = async (categoryId) => {
  const children = await Category.find({ parent: categoryId });
  const childIds = await Promise.all(
    children.map(async (child) => await getAllCategoryIds(child._id))
  );
  // console.log('childIds', childIds)

  // Làm phẳng mảng con cháu chắt các đời
  return [categoryId, ...childIds.flat()];
};

const getAllProduct = async (req, res, next) => {
  try {
    const { limit, page, sort, type, price, rating, q, categories, code } =
      req.query;

    const sortObj = {};
    if (sort) {
      sortObj.sort = sort;
    } else {
      sortObj.sort = "desc";
    }
    if (sort === "desc") {
      sortObj.price = -1;
    } else {
      sortObj.price = 1;
    }

    // filter có điều kiện
    const filterConditions = {};
    if (type) filterConditions.type = { $regex: new RegExp(type, "i") }; // i' là flag cho tìm kiếm không phân biệt hoa thường
    if (rating) {
      const ratingValue = Number(rating);
      if (!isNaN(ratingValue)) {
        filterConditions.rating = { $gte: Number(rating) };
      } else {
        console.warn(`Invalid rating value: ${rating}`);
      }
    }
    if (code) filterConditions.code = Number(code);
    if (price && !isNaN(price))
      filterConditions.price = { $lte: Number(price) };
    if (q) filterConditions.name = { $regex: new RegExp(q, "i") }; // i' là flag cho tìm kiếm không phân biệt hoa thường
    if (categories) {
      const category = await Category.findOne({ _id: categories });

      if (!category) return; // Optional: xử lý nếu không tìm thấy

      // Nếu là danh mục cha → lọc chính nó và tất cả danh mục con
      const allCategoryIds = await getAllCategoryIds(category._id);
      filterConditions.categories = { $in: allCategoryIds };
    }

    const result = await productService.getAllProduct(
      Number(limit) || 8,
      Number(page) || 1,
      sortObj,
      filterConditions
    );
    res.status(StatusCodes.OK).json(result);
    return next();
  } catch (error) {
    next(error);
  }
};

const getDetailProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Bắt buộc phải có ID" });

    const result = await productService.getDetailProduct(id);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Bắt buộc phải có ID" });
    const isArray = Array.isArray(id) ? id : [id];
    const result = await productService.deleteProduct(isArray);
    if (!result.success)
      return res.status(StatusCodes.UNAUTHORIZED).json(result);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing query" });
    }

    const regex = new RegExp(removeVietnameseTones(q), "i");

    const filterConditions = { slugName: { $regex: regex } };

    const result = await Product.find(filterConditions);
    res.json(result);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Server Error" });
  }
};

export const productController = {
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  searchProduct,
  getDetailProduct,
  getAllProduct,
};
