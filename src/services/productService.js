import productModel from "~/models/productModel";
import bcrypt from "bcrypt";
import userModel from "~/models/UserModel";
import categoryModel from "~/models/CategoryModel";

const { StatusCodes } = require("http-status-codes");

const createProduct = async (newProduct) => {
  try {
    const { name } = newProduct;
    const checkProduct = await productModel.findOne({ name });
    if (checkProduct !== null) {
      return {
        success: false,
        message: "Tên sản phẩm đã tồn tại",
      };
    }
    const createProduct = await productModel.create(newProduct);
    return {
      success: true,
      message: "Tạo sản phẩm thành công",
      product: createProduct,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const readProduct = (req, res) => {
  // Logic to read a product
  res.status(StatusCodes.OK).send("Product details");
};

const updateProduct = async (id, data) => {
  try {
    const product = await productModel.findById(id);
    if (!product) throw new Error("Sản phẩm không tồn tại");

    let updateData = {};

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

    // Cập nhật updateData nếu có giá trị hợp lệ từ data
    for (const item in validations) {
      if (validations[item](data[item])) {
        updateData[item] = data[item]; // Cập nhật đúng giá trị từ data
      }
    }

    // Tiến hành cập nhật sản phẩm
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (updatedProduct && Object.keys(updatedProduct).length > 0) {
      return {
        success: true,
        message: "Cập nhật Sản phẩm thành công",
        data: updatedProduct,
      };
    } else {
      return {
        success: false,
        message: "Không có thay đổi nào được thực hiện",
      };
    }
  } catch (error) {
    throw new Error(error.message || "Lỗi trong quá trình cập nhật");
  }
};

const deleteProduct = async (id) => {
  try {
    const productCurrent = await productModel.findById(id);
    if (!productCurrent) {
      throw new Error("Sản phẩm không tồn tại");
    }
    await productModel.findByIdAndDelete(id);
    return {
      success: true,
      message: "Xóa sản phẩm thành công",
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};
const deleteAllProduct = async (passwordAdmin) => {
  try {
    const admin = await userModel.findOne({ isAdmin: true });
    if (!admin) return { message: "Không tìm thấy tài khoản admin" };

    const isMatch = await bcrypt.compare(passwordAdmin, admin?.password);
    if (!isMatch) return { message: "Password admin không trùng khớp" };

    const result = await productModel.deleteMany({});
    if (result.deletedCount === 0) return { message: "Không có sản phẩm nào" };

    return {
      message: "Xóa tất cả sản phẩm thành công",
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

const getDetailProduct = async (id) => {
  try {
    const product = await productModel.findById(id);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }
    return { product };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};
const getAllProduct = async (limit, page, sortObj, filterConditions) => {
  try {
    let products;
    let totalProduct;
    if (Object.keys(filterConditions).length > 0) {
      totalProduct = await productModel.countDocuments(filterConditions);
      products = await productModel
        .find(filterConditions)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort(sortObj);
    } else {
      totalProduct = await productModel.countDocuments();
      products = await productModel
        .find({})
        .limit(limit)
        .skip((page - 1) * limit)
        .sort(sortObj);
    }

    return {
      data: products,
      total: totalProduct,
      currentPage: page,
      totalPage: Math.ceil(totalProduct / limit),
      length: products.length,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

const createCategoryProduct = async (category) => {
  const { title, id } = category;
  try {
    const exitCategory = await categoryModel.findOne({ title, id });
    if (exitCategory) throw new Error("Category đã tồn tại");

    const result = await categoryModel.create({ title, id });

    return {
      success: true,
      message: "Tạo danh mục thành công",
      category: result,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};
export const productService = {
  createProduct,
  readProduct,
  updateProduct,
  deleteProduct,
  deleteAllProduct,
  getAllProduct,
  getDetailProduct,
  createCategoryProduct,
};
