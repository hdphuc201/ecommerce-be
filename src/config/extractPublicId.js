export const extractPublicIdFromUrl = (url) => {
    const regex = /\/v\d+\/(.*?)(?=\.\w{3,4}$)/;
    const match = url.match(regex);
    // Kiểm tra nếu có match và trả về public_id hợp lệ
    if (match && match[1]) {
        return match[1];
    } else {
        return null; // Trả về null nếu không thể lấy public_id
    }
};
