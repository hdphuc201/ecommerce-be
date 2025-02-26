// utils/removeVietnameseTones.js

// Hàm loại bỏ dấu tiếng Việt và khoảng trắng dư thừa
const removeVietnameseTones = (str) => {
  return str
    .normalize("NFD") // Chuyển sang dạng chuẩn NFD của Unicode
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các ký tự dấu (combining diacritical marks)
    .replace(/\s+/g, " ") // Loại bỏ khoảng trắng dư thừa
    .trim(); // Loại bỏ khoảng trắng đầu và cuối
};

export default removeVietnameseTones;
