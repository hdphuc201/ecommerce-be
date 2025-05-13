import Category from "~/models/categoryModel";
import createSlug from "~/utils/slug";

const createCateParent = async (reqBody) => {
  const { title } = reqBody;
  try {
    // Kiểm tra xem danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ title: title },);

    if (existingCategory) {
      return { success: false, message: "Danh mục đã tồn tại" };
    }

    // Tạo mới danh mục
    const result = await Category.create({
      title,
      slug: createSlug(title),
    });

    return {
      success: true,
      message: title ? "Tạo danh mục con thành công" : "Tạo danh mục cha thành công",
      Category: result,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

const createCateChildrent = async (category) => {
  const { title, childrent } = category;

  try {
    if (!title) {
      return { success: false, message: "Chọn danh mục cha" };
    }
    // Kiểm tra xem danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({ title: createSlug(title) });

    if (existingCategory) {
      return { success: false, message: "Danh mục đã tồn tại" };
    }

    // Tạo mới danh mục
    const result = await Category.create({
      title: title || childrent,
      slug: createSlug(title || childrent),
      childrent: title ? childrent : "" // Nếu có title thì childrent là danh mục con
    });

    return {
      success: true,
      message: "Tạo danh mục con thành công",
      Category: result,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

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

export const categoryService = {
  createCateParent,
  createCateChildrent,
  deleteCate,
};
