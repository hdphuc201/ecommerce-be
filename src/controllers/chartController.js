import { StatusCodes } from "http-status-codes";

import Order from "~/models/orderModel";

// GET /api/chart/revenue-statistics?type=month&year=2024
const getRevenueStatistics = async (req, res) => {
  const { type = "month", year = new Date().getFullYear() } = req.query;

  let groupBy;
  if (type === "month") {
    groupBy = { $month: "$createdAt" };
  } else if (type === "week") {
    groupBy = { $week: "$createdAt" };
  } else {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, message: "Loại thống kê không hợp lệ" });
  }

  try {
    const data = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const formatted = Array(type === "month" ? 12 : 53)
      .fill(0)
      .map((_, i) => {
        const found = data.find((item) => item._id === i + 1);
        return {
          label: `${type === "month" ? "Tháng" : "Tuần"} ${i + 1}`,
          totalRevenue: found?.totalRevenue || 0,
          totalOrders: found?.totalOrders || 0,
        };
      });

    res.status(StatusCodes.OK).json({ success: true, data: formatted });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu thống kê",
      error: err.message,
    });
  }
};

// GET /api/chart/revenue-products?type=month&label=Tháng 3&year=2024
const getProductsInPeriod = async (req, res) => {
  const { type, label, year } = req.body;
  if (!type || !label || !year) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Thiếu tham số 'type', 'label' hoặc 'year'",
    });
  }

  // Tìm chỉ số (index) từ label. Ví dụ: "Tháng 3" => 3
  const index = parseInt(label.split(" ")[1]);
  if (isNaN(index)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Label không hợp lệ",
    });
  }

  // Tính ngày bắt đầu và kết thúc tương ứng
  let createdAt, endDate;
  if (type === "month") {
    createdAt = new Date(year, index - 1, 1);
    endDate = new Date(year, index, 1); // tháng kế tiếp
  } else if (type === "week") {
    const firstDay = new Date(year, 0, 1); // 1/1/year
    const daysOffset = (index - 1) * 7;
    createdAt = new Date(firstDay.setDate(firstDay.getDate() + daysOffset));
    endDate = new Date(createdAt);
    endDate.setDate(createdAt.getDate() + 7);
  } else {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Loại thống kê không hợp lệ",
    });
  }

  try {
    const orders = await Order.find({
      createdAt: { $gte: createdAt, $lte: endDate },
      isPaid: true,
    }).select("orderItems");

    const mergedItems = {};
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const id = item.productId.toString();
        if (!mergedItems[id]) {
          mergedItems[id] = {
            productId: item.productId,
            name: item.name,
            image: item.image,
            quantity: 0,
          };
        }
        mergedItems[id].quantity += item.quantity;
      });
    });

    const result = Object.values(mergedItems);

    res.status(StatusCodes.OK).json({ success: true, data: result });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: err.message,
    });
  }
};

export const chartController = {
  getRevenueStatistics,
  getProductsInPeriod,
};
