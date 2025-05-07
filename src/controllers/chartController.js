import { StatusCodes } from "http-status-codes";

import Order from "~/models/orderModel";
// Lấy giỏ hàng của user
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
          // kiểm tra thanh tóa, chỉ tính khi thnah toán hoàn tất là true
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
      message: "Lỗi khi lấy dữ liệu",
      error: err.message,
    });
  }
};

export const chartController = {
  getRevenueStatistics,
};
