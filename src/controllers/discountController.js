import { StatusCodes } from "http-status-codes";

import Discount from "~/models/discountModel";
import Order from "~/models/orderModel";

// ✅ Tạo mã giảm giá mới
const createDiscount = async (req, res, next) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minOrderValue,
      usageLimit,
      startDate,
      endDate,
    } = req.body;

    const errors = [];

    // 1. Validate code
    if (!code || typeof code !== "string") {
      errors.push("Mã giảm giá là bắt buộc");
    } else if (!/^[A-Z0-9]+$/.test(code.trim().toUpperCase())) {
      errors.push(
        "Mã giảm giá chỉ bao gồm chữ in hoa và số, không ký tự đặc biệt"
      );
    }

    // 2. Kiểm tra trùng mã
    const existing = await Discount.findOne({
      code: code?.trim().toUpperCase(),
    });
    if (existing) {
      errors.push("Mã giảm giá đã tồn tại");
    }

    // 3. Validate description
    if (!description || typeof description !== "string") {
      errors.push("Mô tả là bắt buộc");
    }

    // 4. Validate type
    if (!["percent", "fixed"].includes(type)) {
      errors.push("Loại phải là 'percent' hoặc 'fixed'");
    }

    if (type === "percent" && (value < 0 || value > 100)) {
      errors.push("Phần trăm giảm giá phải từ 0 đến 100");
    }
    if (type === "fixed" && value <= 0) {
      errors.push("Giá trị cố định phải lớn hơn 0");
    }


    // 5. Validate value
    if (minOrderValue && minOrderValue < 1000) {
      errors.push("Giá trị đơn hàng tối thiểu là 1.000₫");
    }

    // 6. Validate ngày bắt đầu và kết thúc
    if (!startDate || !endDate) {
      errors.push("Ngày bắt đầu và kết thúc là bắt buộc");
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        errors.push("Ngày kết thúc phải sau ngày bắt đầu");
      }
    }
    // Nếu có lỗi, trả luôn
    if (errors.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: errors.join(" | "),
      });
    }

    // Tạo mới
    const discount = await Discount.create({
      code: code.trim().toUpperCase(),
      description,
      type,
      value,
      minOrderValue: minOrderValue ?? 0,
      usageLimit: usageLimit ?? 999,
      usedCount: 0,
      isActive: true,
      startDate,
      endDate,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Tạo mã giảm giá thành công",
      data: discount,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Lấy tất cả mã giảm giá
const getAllDiscounts = async (req, res, next) => {
  const { code } = req.query;
  try {
    const filter = {};
    if (code) filter.code = { $regex: new RegExp(code, "i") };
    const discounts = await Discount.find(filter).sort({ createdAt: -1 });
    if (!discounts) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Không tìm thấy mã" });
    }
    res.status(StatusCodes.OK).json({ success: true, data: discounts || [] });
  } catch (error) {
    next(error);
  }
};

// ✅ Kiểm tra mã giảm giá hợp lệ
const validateDiscountCode = async (req, res, next) => {
  try {
    const { code, subTotal, id } = req.body;

    if (id === undefined) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Đăng nhập để lấy mã giảm giá" });
    }
    const discount = await Discount.findOne({ code });

    if (!discount) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Mã không tồn tại hoặc không hoạt động",
      });
    }

    const now = new Date();
    if (now < discount.startDate || now > discount.endDate) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Mã chưa áp dụng hoặc đã hết hạn" });
    }

    const listOrder = await Order.find({ id });

    const findCode = listOrder
      .filter((item) => item)
      .map((item) => item.discount);
    if (findCode.includes(discount.code)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Mã đã được sử dụng hết lượt" });
    }

    if (subTotal < discount.minOrderValue) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Đơn hàng phải từ ${discount.minOrderValue.toLocaleString(
          "de-DE"
        )}₫ để dùng mã`,
      });
    }

    let discountAmount =
      discount.type === "percent"
        ? (subTotal * discount.value) / 100
        : discount.value;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Áp dụng mã thành công",
      discountAmount,
      discount,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Xóa mã giảm giá
const deleteDiscount = async (req, res, next) => {
  try {
    const { id } = req.query;
    const isArray = Array.isArray(id) ? id : [id];
    const discount = await Discount.deleteMany({ _id: { $in: isArray } });
    if (!discount) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Không tìm thấy mã để xoá" });
    }
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Xoá mã giảm giá thành công" });
  } catch (error) {
    next(error);
  }
};

const updateDiscount = async (req, res, next) => {
  const {
    _id,
    code,
    description,
    type,
    value,
    minOrderValue,
    usageLimit,
    usedCount,
    isActive,
    startDate,
    endDate,
  } = req.body;

  // Kiểm tra tính hợp lệ của _id
  if (!_id) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "ID mã giảm giá không hợp lệ",
    });
  }

  try {
    // Chỉ cập nhật những field được cung cấp
    const updateData = {};

    // Kiểm tra và cập nhật code
    if (code && /^[A-Z0-9]+$/.test(code.trim())) {
      updateData.code = code.trim();
    } else if (code && !/^[A-Z0-9]+$/.test(code.trim())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Mã giảm giá chỉ được phép chứa chữ cái viết hoa và số",
      });
    }

    // Kiểm tra và cập nhật description
    if (description && String(description).trim() !== "") {
      updateData.description = description.trim();
    }
    // Kiểm tra và cập nhật type
    if (type && ["percent", "fixed"].includes(type)) {
      updateData.type = type;
    }

    // Kiểm tra và cập nhật value
    if (value && !isNaN(Number(value)) && Number(value) >= 0) {
      updateData.value = Number(value);
    }

    // Kiểm tra và cập nhật minOrderValue
    if (
      minOrderValue &&
      !isNaN(Number(minOrderValue)) &&
      Number(minOrderValue) >= 0
    ) {
      updateData.minOrderValue = Number(minOrderValue);
    }

    // Kiểm tra và cập nhật usageLimit
    if (usageLimit && !isNaN(Number(usageLimit)) && Number(usageLimit) >= 0) {
      updateData.usageLimit = Number(usageLimit);
    }

    // Kiểm tra và cập nhật usedCount
    if (usedCount && !isNaN(Number(usedCount)) && Number(usedCount) >= 0) {
      updateData.usedCount = Number(usedCount);
    }

    // Kiểm tra và cập nhật isActive
    if (typeof isActive !== "undefined") {
      updateData.isActive = Boolean(isActive);
    }

    // Kiểm tra và cập nhật startDate
    if (startDate && !isNaN(new Date(startDate).getTime())) {
      updateData.startDate = new Date(startDate);
    }

    // Kiểm tra và cập nhật endDate
    if (endDate && !isNaN(new Date(endDate).getTime())) {
      updateData.endDate = new Date(endDate);
    }

    // Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
    if (
      startDate &&
      endDate &&
      new Date(startDate).getTime() >= new Date(endDate).getTime()
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
      });
    }

    // Thực hiện cập nhật Discount
    const updateDiscount = await Discount.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!updateDiscount) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Không có gì thay đổi hoặc mã giảm giá không tồn tại",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: updateDiscount, // Trả về dữ liệu đã cập nhật để người dùng có thể thấy sự thay đổi
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật mã giảm giá",
    });
  }
};

export const discountController = {
  createDiscount,
  getAllDiscounts,
  validateDiscountCode,
  deleteDiscount,
  updateDiscount,
};
