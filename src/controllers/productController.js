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
      image: (valid) => valid,
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
    return res.status(400).json(result);
  } catch (error) {
    next(error);
  }
};

const testProduct = async (req, res, next) => {
  const newProduct = new Product(req.body);

  // Middleware `pre('save')` sẽ chạy ngay tại đây
  console.log("Product đã được tạo, nhưng chưa lưu:", newProduct);
  try {
    const validations = {
      name: (valid) => valid,
      // image: (valid) => valid,
      categories: (valid) => valid,
      price: (valid) => Number(valid),
      price_old: (valid) => Number(valid),
      countInstock: (valid) => Number(valid),
      rating: (valid) => valid,
      description: (valid) => valid,
    };

    // const newProduct = await Product.create({
    //   name: "Văn hóa",
    //   image: "https://example.com/image.jpg",
    //   categories: 1,
    //   price: 23000,
    //   price_old: 25000,
    //   countInstock: 10,
    //   rating: 4.5,
    //   description: "Sản phẩm mới",
    // });
    for (const item in validations) {
      console.log("validations[item]", req.body[item]);
      if (!validations[item](req.body[item])) {
        return res
          .status(401)
          .json({ message: `${item} thiếu hoặc sai định dạng` });
      }
    }
    console.log("Product  lưu:", newProduct);

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    next(error);
  }
};

const addCart = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(401).json({ success: false, message: "Không có id" });
    }
    const itemProduct = await Product.findById(id);
    console.log("itemProduct", itemProduct);

    let listCart = [];

    listCart.push(itemProduct);
    console.log(listCart)
    res.status(200).json({ success: true, listProduct: listCart });
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
  testProduct,
  addCart,
};
