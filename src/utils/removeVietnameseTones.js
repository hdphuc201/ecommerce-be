const removeVietnameseTones = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
    .replace(/đ/g, "d") // Chuyển đổi đ -> d
    .replace(/Đ/g, "D") // Chuyển đổi Đ -> D
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Xóa ký tự đặc biệt
    .trim();
};

export default removeVietnameseTones;