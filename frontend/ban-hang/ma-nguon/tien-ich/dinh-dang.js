/*
 * tien-ich/dinh-dang.js
 * Tập hợp các hàm/hằng tiện ích dùng chung cho việc ĐỊNH DẠNG hiển thị:
 *  - dinhDangTien: định dạng số thành chuỗi tiền tệ Việt Nam.
 *  - anhDuPhong: ảnh placeholder (SVG nhúng) dùng khi sản phẩm thiếu ảnh.
 */

// Định dạng số tiền kiểu Việt Nam, ví dụ: 1.250.000 ₫
// Number(so || 0): ép về số, nếu so rỗng/undefined/null thì coi như 0 để tránh lỗi NaN
// toLocaleString("vi-VN"): thêm dấu chấm phân tách hàng nghìn theo định dạng VN
export const dinhDangTien = (so) => Number(so || 0).toLocaleString("vi-VN") + " ₫";

// Ảnh dự phòng khi sản phẩm chưa có ảnh hoặc ảnh lỗi
// Dùng Data URI nhúng trực tiếp SVG (không cần tải file ảnh ngoài)
export const anhDuPhong =
  // Tiền tố Data URI khai báo nội dung là ảnh SVG dạng văn bản utf8
  "data:image/svg+xml;utf8," +
  // encodeURIComponent: mã hóa các ký tự đặc biệt (dấu cách, <, >, #...) cho hợp lệ trong URI
  encodeURIComponent(
    // SVG 300x300: nền xám nhạt (%23eef2f7 = #eef2f7) kèm chữ "TVU Store" canh giữa
    // %23 là mã hóa của ký tự '#' trong mã màu; text-anchor + dominant-baseline để căn giữa chữ
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='%23eef2f7'/><text x='50%' y='50%' font-size='20' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'>TVU Store</text></svg>`
  );
