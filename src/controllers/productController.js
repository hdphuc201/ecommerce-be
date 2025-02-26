import { productService } from "~/services/productService";
import categoryModel from "~/models/CategoryModel";
const { StatusCodes } = require("http-status-codes");

const createProduct = async (req, res, next) => {
  try {
    const validations = {
      name: (valid) => valid,
      image: (valid) => valid,
      categories: (valid) => valid,
      price: (valid) => valid,
      price_old: (valid) => valid,
      countInstock: (valid) => valid,
      rating: (valid) => valid,
      description: (valid) => valid,
    };

    for (const item in validations) {
      // console.log("validations[item]", req.body[item]);
      if (!validations[item](req.body[item]))
        return res.status(401).json({ message: `Missing valid ${item}` });
    }

    const result = await productService.createProduct(req.body);
    if (!result.success) res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const readProduct = (req, res, next) => {
  // Logic to read a product
  res.status(StatusCodes.OK).send("Product details");
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) res.status(401).json({ message: "Không tìm thấy ID Product" });
    const result = await productService.updateProduct(id, req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });

    const result = await productService.deleteProduct(id);
    if (!result.success) res.status(401).json(result);
    return res.status(200).json(result);
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
        filterConditions.rating = { $eq: Number(rating) };
      } else {
        console.warn(`Invalid rating value: ${rating}`);
      }
    }
    if (price && !isNaN(price))
      filterConditions.price = { $gte: Number(price) };
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

const deleteAllProduct = async (req, res, next) => {
  try {
    const { passwordAdmin } = req.body;
    if (!passwordAdmin)
      res.status(400).json({ message: "Password admin là bắt buộc" });

    const result = await productService.deleteAllProduct(passwordAdmin);
    if (!result.success) return res.status(400).json(result);
  } catch (error) {
    next(error);
  }
};

const createCategoryProduct = async (req, res, next) => {
  try {
    const category = req.body;
    if (!category) return res.status(400).json({ message: "Chưa có danh mục" });

    const result = await productService.createCategoryProduct(category);
    if (!result.success) res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getCategoryProduct = async (req, res, next) => {
  try {
    const result = await categoryModel.find({});
    if (!result) return res.status(400).json({ message: "Không có danh mục" });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const productController = {
  createProduct,
  readProduct,
  updateProduct,
  deleteProduct,
  getDetailProduct,
  getAllProduct,
  deleteAllProduct,
  createCategoryProduct,
  getCategoryProduct,
};
