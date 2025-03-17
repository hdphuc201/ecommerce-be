import Category from "~/models/categoryModel";
import Product from "~/models/productModel";
import { productService } from "~/services/productService";
import removeVietnameseTones from "~/utils/removeVietnameseTones";

const createProduct = async (req, res, next) => {
  if (!req.body.name) {
    return res
      .status(400)
      .json({ success: false, message: "Tên sản phẩm là bắt buộc!" });
  }

  try {
    const validations = {
      name: (valid) => valid,
      image: (valid) => valid.length > 0,
      categories: (valid) => valid,
      price: (valid) => Number(valid),
      price_old: (valid) => Number(valid),
      countInstock: (valid) => Number(valid),
      rating: (valid) => valid,
      description: (valid) => valid,
    };

    for (const item in validations) {
      // console.log("validations[item]", req.body[item]);
      if (!validations[item](req.body[item])) {
        return res
          .status(401)
          .json({ message: `${item} thiếu hoặc sai định dạng` });
      }
    }

    const result = await productService.createProduct(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const result = await productService.updateProduct(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAllProduct = async (req, res, next) => {
  try {
    const { limit, page, sort, type, price, rating, q, categories } = req.query;

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
    if (price && !isNaN(price))
      filterConditions.price = { $lte: Number(price) };
    if (q) filterConditions.name = { $regex: new RegExp(q, "i") }; // i' là flag cho tìm kiếm không phân biệt hoa thường
    if (categories) {
      const categoriesValue = Number(categories);
      if (!isNaN(categoriesValue)) {
        filterConditions.categories = { $eq: Number(categories) };
      } else {
        console.warn(`Invalid categories value: ${categories}`);
      }
    }
    const result = await productService.getAllProduct(
      Number(limit) || 8,
      Number(page) || 1,
      sortObj,
      filterConditions
    );
    res.status(200).json(result);
    return next();
  } catch (error) {
    next(error);
  }
};

const getDetailProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });

    const result = await productService.getDetailProduct(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });
    const isArray = Array.isArray(id) ? id : [id];
    const result = await productService.deleteProduct(isArray);
    if (!result.success) return res.status(401).json(result);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteAllProduct = async (req, res, next) => {
  try {
    const { passwordAdmin } = req.body;
    if (!passwordAdmin) {
      return res.status(400).json({ message: "Password admin là bắt buộc" }); // Thêm return ở đây
    }

    const result = await productService.deleteAllProduct(passwordAdmin);
    if (!result.success) return res.status(400).json(result);
  } catch (error) {
    next(error);
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Missing query" });
    }

    const regex = new RegExp(removeVietnameseTones(q), "i");

    const filterConditions = { slugName: { $regex: regex } };

    const result = await Product.find(filterConditions);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

const getCate = async (req, res, next) => {
  try {
    const result = await Category.find({});
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createCate = async (req, res, next) => {
  try {
    const category = req.body;
    if (!category) return res.status(400).json({ message: "Chưa có danh mục" });

    const result = await productService.createCate(category);
    if (!result.success) {
      return res.status(400).json(result); // Dừng hàm lại sau khi gửi phản hồi lỗi
    }
    return res.status(200).json(result); // Nếu thành công, gửi phản hồi thành công
  } catch (error) {
    next(error);
  }
};

const deleteCate = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: "không có ID danh mục" });
    const isArray = Array.isArray(id) ? id : [id];
    const result = await productService.deleteCate(isArray);
    if (!result.success) return res.status(401).json(result);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteAllCate = async (req, res, next) => {
  try {
    const result = await Category.deleteMany({});
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const productController = {
  createProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  getDetailProduct,
  getAllProduct,
  deleteAllProduct,
  // cate
  getCate,
  createCate,
  deleteCate,
  deleteAllCate,
};
