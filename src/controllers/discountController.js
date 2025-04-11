import Order from "./../models/orderModel";
import Discount from "./../models/discountModel";

// ✅ Tạo mã giảm giá mới
const createDiscount = async (req, res, next) => {
  try {
    const validations = {
      code: (value) =>
        typeof value === "string" &&
        value.trim() !== "" &&
        /^[A-Z0-9]+$/.test(value.trim()),
      description: (value) =>
        typeof value === "string" && value.trim().length > 0,
      type: (value) => ["percent", "fixed"].includes(value),
      value: (value, type) => {
        const num = Number(value);
        if (type === "percent") return num >= 0 && num <= 100;
        if (type === "fixed") return num > 0;
        return false;
      },
      startDate: (value) => !!value && !isNaN(new Date(value).getTime()),
      endDate: (value) => !!value && !isNaN(new Date(value).getTime()),
      dateRangeValid: (start, end) => new Date(start) < new Date(end),
    };

    for (const item in validations) {
      if (item === "code" && !validations[item](req.body.code)) {
        return res.status(400).json({
          success: false,
          message: "Mã phải viết hoa và không ký tự đặc biệt",
        });
      }
      if (
        item === "value" &&
        !validations[item](req.body.value, req.body.type)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Giá trị giảm đối đa 100" });
      }

      if (item === "dateRangeValid") continue;

      if (!["value"].includes(item) && !validations[item](req.body[item])) {
        return res
          .status(400)
          .json({ success: false, message: `${item} sai định dạng` });
      }
    }

    if (!validations.dateRangeValid(req.body.startDate, req.body.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
      });
    }

    const existing = await Discount.findOne({
      code: req.body.code.trim().toUpperCase(),
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Mã giảm giá đã tồn tại" });
    }

    const discount = await Discount.create(req.body);
    res.status(201).json({
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
  console.log("🔥 GET /getDiscount called");
  const { code } = req.query;
  try {
    const filter = {};
    if (code) {
      filter.code = code.toUpperCase().trim(); // chuẩn hóa code để so sánh
    }
    const discounts = await Discount.find(filter).sort({ createdAt: -1 });
    if (!discounts) {
      return res
        .status(401)
        .json({ success: false, message: "Không tìm thấy mã" });
    }
    res.status(200).json({ success: true, data: discounts || [] });
  } catch (error) {
    next(error);
  }
};

// ✅ Kiểm tra mã giảm giá hợp lệ
const validateDiscountCode = async (req, res, next) => {
  try {
    const { code, subTotal } = req.body;
    const userId = req.user?._id;

    const discount = await Discount.findOne({ code });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Mã không tồn tại hoặc không hoạt động",
      });
    }

    const now = new Date();
    if (now < discount.startDate || now > discount.endDate) {
      return res
        .status(400)
        .json({ success: false, message: "Mã chưa áp dụng hoặc đã hết hạn" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Đăng nhập để lấy mã giảm giá" });
    }

    const listOrder = await Order.find({ userId });

    const findCode = listOrder
      .filter((item) => item)
      .map((item) => item.discount);
    if (findCode.includes(discount.code)) {
      return res
        .status(400)
        .json({ success: false, message: "Mã đã được sử dụng hết lượt" });
    }

    if (subTotal < discount.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng phải từ ${discount.minOrderValue.toLocaleString(
          "de-DE"
        )}đ để dùng mã`,
      });
    }

    let discountAmount =
      discount.type === "percent"
        ? (subTotal * discount.value) / 100
        : discount.value;

    return res.status(200).json({
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
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã để xoá" });
    }
    res
      .status(200)
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
    return res.status(400).json({
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
      return res.status(400).json({
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
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
      });
    }

    // Thực hiện cập nhật Discount
    const updateDiscount = await Discount.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!updateDiscount) {
      return res.status(400).json({
        success: false,
        message: "Không có gì thay đổi hoặc mã giảm giá không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: updateDiscount, // Trả về dữ liệu đã cập nhật để người dùng có thể thấy sự thay đổi
    });
  } catch (error) {
    return res.status(500).json({
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
