// productService.js
import Category from "~/models/categoryModel";
import Product from "~/models/productModel";

/**
 * Đếm số lượng sản phẩm theo category và cập nhật vào DB
 */

const getAllChildCategoryIds = (categories, parentId) => {
  const childIds = [];

  const findChildren = (id) => {
    const children = categories.filter(cat => cat.parent?.toString() === id.toString());
    for (const child of children) {
      childIds.push(child._id);
      findChildren(child._id);
    }
  };

  findChildren(parentId);
  return childIds;
};

const updateProductCountForCategories = async (productCategoryIds) => {
  const categories = await Category.find({});
  const categoryIdStrings = productCategoryIds.flat().map((id) => id.toString()); // flat để phòng trường hợp mảng lồng

  const updatedCategoryIds = new Set();

  for (const categoryId of categoryIdStrings) {
    const currentCategory = categories.find(
      (cat) => cat._id.toString() === categoryId
    );
    if (!currentCategory) continue;

    // 1. Lấy tất cả danh mục con của danh mục hiện tại (nếu có)
    const allChildren = getAllChildCategoryIds(categories, currentCategory._id);

    const allRelevantIds = [currentCategory._id, ...allChildren];

    // 2. Đếm tổng sản phẩm thuộc danh mục này + danh mục con
    const totalCount = await Product.countDocuments({
      categories: { $in: allRelevantIds },
    });

    await Category.findByIdAndUpdate(currentCategory._id, {
      productCount: totalCount,
    });

    updatedCategoryIds.add(currentCategory._id.toString());

    // 3. Cập nhật lên cha nếu có
    let parentId = currentCategory.parent;
    while (parentId) {
      const parentCategory = categories.find(
        (cat) => cat._id.toString() === parentId.toString()
      );
      if (!parentCategory) break;

      const childOfParent = getAllChildCategoryIds(categories, parentCategory._id);
      const relevantIds = [parentCategory._id, ...childOfParent];

      const parentCount = await Product.countDocuments({
        categories: { $in: relevantIds },
      });

      await Category.findByIdAndUpdate(parentCategory._id, {
        productCount: parentCount,
      });

      updatedCategoryIds.add(parentCategory._id.toString());

      parentId = parentCategory.parent;
    }
  }

  return {
    success: true,
    message: "Cập nhật số lượng sản phẩm thành công",
  };
};

/**
 * Tạo sản phẩm mới
 */
const createProduct = async (newProduct, imagePaths) => {
  try {
    const { name } = newProduct;
    const isExists = await Product.findOne({ name });
    if (isExists) {
      return {
        success: false,
        message: "Sản phẩm đã tồn tại",
      };
    }

    const productToCreate = { ...newProduct, image: imagePaths || [] };
    const createdProduct = await Product.create(productToCreate);

    await updateProductCountForCategories([createdProduct.categories]);

    return {
      success: true,
      message: "Tạo sản phẩm thành công",
      product: createdProduct,
    };
  } catch (error) {
    throw new Error(error.message || "Lỗi khi tạo sản phẩm");
  }
};

/**
 * Cập nhật sản phẩm
 */
const updateProduct = async (form) => {
  try {
    const { _id, ...fields } = form;
    const validations = {
      name: (val) => val,
      image: (val) => Array.isArray(val),
      categories: (val) => val,
      price: (val) => val,
      price_old: (val) => val,
      countInstock: (val) => val,
      rating: (val) => val,
      description: (val) => val,
    };

    for (const key in validations) {
      if (!validations[key](fields[key])) {
        return {
          success: false,
          message: `${key} không đúng định dạng hoặc thiếu`,
        };
      }
    }

    const updated = await Product.findByIdAndUpdate(_id, fields, { new: true });
    if (!updated) {
      return {
        success: false,
        message: "Không tìm thấy sản phẩm để cập nhật",
      };
    }

    await updateProductCountForCategories([updated.categories]);
    return {
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updated,
    };
  } catch (error) {
    throw new Error(error.message || "Lỗi khi cập nhật sản phẩm");
  }
};

/**
 * Xoá nhiều sản phẩm
 */
const deleteProduct = async (ids) => {
  try {
    const deleteResult = await Product.deleteMany({ _id: { $in: ids } });
    if (!deleteResult.deletedCount) {
      return { success: false, message: "Không tìm thấy sản phẩm để xoá." };
    }

    await updateProductCountForCategories(ids);

    return {
      success: true,
      message: `${deleteResult.deletedCount} sản phẩm đã được xoá.`,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

/**
 * Lấy chi tiết sản phẩm
 */
const getDetailProduct = async (id) => {
  try {
    const product = await Product.findById(id);
    if (!product) throw new Error("Sản phẩm không tồn tại");
    return { success: true, product };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

/**
 * Lấy danh sách sản phẩm có phân trang, lọc, sort
 */
const getAllProduct = async (limit, page, sortObj, filterConditions) => {
  try {
    const offset = (page - 1) * limit;
    const filter =
      Object.keys(filterConditions).length > 0 ? filterConditions : {};

    const totalProduct = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .limit(limit)
      .skip(offset)
      .sort(sortObj);

    return {
      success: true,
      data: offset >= totalProduct ? [] : products,
      total: totalProduct,
      currentPage: page,
      totalPage: Math.ceil(totalProduct / limit),
      length: offset >= totalProduct ? 0 : products.length,
    };
  } catch (error) {
    throw new Error(error.message || "Lỗi server khi lấy danh sách sản phẩm");
  }
};

export const productService = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProduct,
  getDetailProduct,
};
