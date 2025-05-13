import { StatusCodes } from "http-status-codes";

import Category from "~/models/categoryModel";
import { categoryService } from "~/services/categoryService";
import createSlug from "~/utils/slug";

const getCate = async (req, res, next) => {

  try {

    const result = await Category.find({})
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const createParentCategory = async (req, res) => {
  const { title } = req.body;
  if (!title) return { success: false, message: "Vui lòng nhập tên danh mục" };
  const slug = createSlug(title);
  const existing = await Category.findOne({ slug });

  if (existing) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Danh mục đã tồn tại",
    });
  }

  const newCate = await Category.create({
    title,
    slug,
    parent: null,
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Tạo danh mục cha thành công",
    category: newCate,
  });
};

const createChildCategory = async (req, res) => {
  const { title, parentId } = req.body;
  if (!title || !parentId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, message: "Tên và danh mục cha là bắt buộc" });
  }

  const parent = await Category.findById(parentId);
  if (!parent)
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Không tìm thấy danh mục cha",
    });

  const slug = createSlug(title);

  const existing = await Category.findOne({ title, parent: parentId });
  if (existing)
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Danh mục con đã tồn tại trong danh mục này",
    });

  const child = await Category.create({
    title,
    slug,
    parent: parentId,
  });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Tạo danh mục con thành công",
    category: child,
  });
};

const deleteCate = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "không có ID danh mục" });
    const isArray = Array.isArray(id) ? id : [id];
    const result = await categoryService.deleteCate(isArray);
    if (!result.success)
      return res.status(StatusCodes.UNAUTHORIZED).json(result);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};


export const categoryController = {
  getCate,
  createParentCategory,
  createChildCategory,
  deleteCate,
};
