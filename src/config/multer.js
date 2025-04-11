import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "./cloudinary"; // Đảm bảo cloudinary đã cấu hình đúng
import { env } from "./environment"; // Lấy môi trường

// Upload ảnh cho sản phẩm
const storageProduct = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/products/"); // Lưu ảnh vào folder "products"
  },
  filename: function (req, file, cb) {
    cb(null, `${uuidv4()}-${file.originalname}`); // Tên file bao gồm uuid và tên file gốc
  },
});

// Upload ảnh cho user
const storageUser = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/users/"); // Lưu ảnh vào folder "users"
  },
  filename: function (req, file, cb) {
    cb(null, `${uuidv4()}-${file.originalname}`); // Tên file bao gồm uuid và tên file gốc
  },
});

// Export các middleware multer cho ảnh product và user
export const uploadProduct = multer({
  storage: storageProduct,
  limits: { fileSize: 5 * 1024 * 1024 },
});
export const uploadUser = multer({
  storage: storageUser,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Function xử lý upload ảnh
// helpers/image.helper.js
export const handleImageUpload = async (file, type) => {
  if (!file) return null;

  if (env.BUILD_MODE === "production") {
    const folder = type === "product" ? "products" : "users";
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
    });
    return result.secure_url;
  } else {
    const folderPath = type === "product" ? "products" : "users";
    return `http://localhost:8017/uploads/${folderPath}/${file.filename}`;
  }
};

export const handleMultipleImageUpload = async (files, type) => {
  if (!files || !files.length) return [];

  if (env.BUILD_MODE === "production") {
    const folder = type === "product" ? "products" : "users";
    const uploads = files.map((file) =>
      cloudinary.uploader.upload(file.path, { folder })
    );
    const results = await Promise.all(uploads);
    return results.map((res) => res.secure_url);
  } else {
    return files.map(
      (file) =>
        `http://localhost:8017/uploads/${
          type === "product" ? "products" : "users"
        }/${file.filename}`
    );
  }
};
