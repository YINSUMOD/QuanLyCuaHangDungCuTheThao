/*
 * File: dinh-dang.js
 * Vai trò: Tập hợp các hàm tiện ích (utility) dùng để ĐỊNH DẠNG dữ liệu khi hiển thị
 *          trên giao diện frontend của hệ thống quản lý cửa hàng dụng cụ thể thao.
 * Bao gồm: định dạng số tiền (VND) và định dạng ngày giờ theo chuẩn Việt Nam (vi-VN).
 * Các hàm này được export để tái sử dụng ở nhiều component khác nhau.
 */

// Các hàm tiện ích định dạng hiển thị

// Định dạng số tiền theo kiểu Việt Nam, ví dụ: 1.250.000 ₫
// - Number(so || 0): ép kiểu về số; nếu "so" rỗng/null/undefined thì coi như 0 để tránh lỗi NaN
// - toLocaleString("vi-VN"): chèn dấu chấm phân tách hàng nghìn theo chuẩn Việt Nam
// - Nối thêm chuỗi " ₫" (ký hiệu đồng) vào cuối kết quả
export const dinhDangTien = (so) => Number(so || 0).toLocaleString("vi-VN") + " ₫";

// Định dạng ngày giờ theo kiểu Việt Nam
// - Nếu "chuoi" có giá trị: tạo đối tượng Date rồi hiển thị theo định dạng vi-VN (ngày/tháng/năm giờ:phút:giây)
// - Nếu "chuoi" rỗng/không hợp lệ: trả về chuỗi rỗng "" để tránh hiển thị "Invalid Date"
export const dinhDangNgay = (chuoi) =>
  chuoi ? new Date(chuoi).toLocaleString("vi-VN") : "";
