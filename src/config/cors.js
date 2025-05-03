import { WHITELIST_DOMAINS } from "~/utils/constants";
import { env } from "~/config/environment";
import { StatusCodes } from "http-status-codes";
import ApiError from "~/utils/ApiError";

// Cấu hình CORS Option trong dự án thực tế
export const corsOptions = {
  origin: function (origin, callback) {
    if (env.BUILD_MODE === "dev") {
      return callback(null, true);
    }
    if (!origin) return callback(null, true);

    // Kiểm tra xem origin có phải là domain được chấp nhận hay không
    if (WHITELIST_DOMAINS.includes(origin)) return callback(null, true);

    // Cuối cùng nếu domain không được chấp nhận thì trả về lỗi
    return callback(
      new ApiError(
        StatusCodes.FORBIDDEN,
        `${origin} not allowed by our CORS Policy.`
      )
    );
  },

  optionsSuccessStatus: 200,
  credentials: true,
};
