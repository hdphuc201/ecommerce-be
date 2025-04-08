import Category from "~/models/categoryModel";
import Product from "~/models/productModel";

const createProduct = async (newProduct, imagePaths) => {
  try {
    const { name, } = newProduct;
    const checkProduct = await Product.findOne({ name });
    if (checkProduct !== null) {
      return {
        success: false,
        message: "Tên sản phẩm đã tồn tại",
      };
    }
    const _newProduct = { ...newProduct, image: imagePaths || [] };

    const createProduct = await Product.create(_newProduct);
    return {
      success: true,
      message: "Tạo sản phẩm thành công",
      product: createProduct,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const updateProduct = async (form) => {
  try {
    const { _id } = form;
    const validations = {
      name: (valid) => valid,
      image: (valid) => Array.isArray(valid), // hoặc valid.length > 0 nếu bắt buộc
      categories: (valid) => Number(valid),
      price: (valid) => valid,
      price_old: (valid) => valid,
      countInstock: (valid) => valid,
      rating: (valid) => valid,
      description: (valid) => valid,
    };

    let updateData = {};

    // ✅ Kiểm tra tất cả các field trước khi return lỗi
    for (const item in validations) {
      if (!validations[item](form[item])) {
        return {
          success: false,
          message: `${item} không đúng định dạng hoặc thiếu`,
        };
      }
      updateData[item] = form[item]; // ✅ Thêm vào updateData mà không return ngay
    }

    // Nếu không có dữ liệu hợp lệ để update, return lỗi
    if (Object.keys(updateData).length === 0) {
      return { success: false, message: "Không có dữ liệu cập nhật hợp lệ" };
    }

    // Tiến hành cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (updatedProduct) {
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

const deleteProduct = async (ids) => {
  try {
    const result = await Product.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount > 0) {
      return {
        success: true,
        message: `${result.deletedCount} sản phẩm đã được xóa.`,
      };
    } else {
      return { success: false, message: "Không tìm thấy sản phẩm nào để xóa." };
    }
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};
const deleteAllProduct = async () => {
  try {
    const result = await Product.deleteMany({});
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
    const product = await Product.findById(id);
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
    const offset = (page - 1) * limit;

    // Xác thực page và limit để đảm bảo chúng là các số nguyên dương
    if (page <= 0 || limit <= 0) {
      return {
        success: false,
        message: "Page và limit phải là các số nguyên dương",
      };
    }

    if (Object.keys(filterConditions).length > 0) {
      totalProduct = await Product.countDocuments(filterConditions);
      products = await Product.find(filterConditions)
        .limit(limit)
        .skip(offset)
        .sort(sortObj);
    } else {
      totalProduct = await Product.countDocuments();
      products = await Product.find({}).limit(limit).skip(offset).sort(sortObj);
    }

    if (offset >= totalProduct) {
      return {
        data: [],
        total: totalProduct,
        currentPage: page,
        totalPage: Math.ceil(totalProduct / limit),
        length: 0,
      };
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

// category
const createCate = async (category) => {
  const { title, id } = category;

  // Kiểm tra xem id và title có hợp lệ không
  if (typeof id !== "number") {
    return { success: false, message: "Sai định dạng" };
  }
  if (!id || !title || title.trim() === "") {
    return { success: false, message: "ID và title là bắt buộc" };
  }

  try {
    // Kiểm tra xem danh mục đã tồn tại chưa
    const exitCategory = await Category.findOne({
      $or: [{ id }, { title }],
    });
    if (exitCategory) return { success: false, message: "Danh mục đã tồn tại" };

    // Tạo mới danh mục
    const result = await Category.create({ title, id });

    return {
      success: true,
      message: "Tạo danh mục thành công",
      Category: result,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};
// Xóa sản phẩm theo ID
const deleteCate = async (ids) => {
  try {
    const result = await Category.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount > 0) {
      return {
        success: true,
        message: `${result.deletedCount} danh mục đã được xóa.`,
      };
    } else {
      return { success: false, message: "Không tìm thấy danh mục nào để xóa." };
    }
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

export const productService = {
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProduct,
  getAllProduct,
  getDetailProduct,
  // cate
  createCate,
  deleteCate,
};
