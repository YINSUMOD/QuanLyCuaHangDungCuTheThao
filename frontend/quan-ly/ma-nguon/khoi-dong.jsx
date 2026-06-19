/*
 * Điểm khởi chạy (entry point) của ứng dụng React phía frontend.
 * Vai trò: gắn (mount) cây component gốc vào thẻ <div id="root"> trong index.html,
 * đồng thời bọc ứng dụng bằng các provider cần thiết: định tuyến (Router) và xác thực.
 */
// Điểm khởi chạy của ứng dụng React
// Thư viện React cốt lõi
import React from "react";
// API render của React 18 (createRoot) để gắn ứng dụng vào DOM
import ReactDOM from "react-dom/client";
// Router dựa trên History API của trình duyệt để điều hướng giữa các trang
import { BrowserRouter } from "react-router-dom";
// Component gốc chứa toàn bộ giao diện và khai báo các tuyến (route)
import UngDung from "./ung-dung.jsx";
// Provider cung cấp ngữ cảnh xác thực (trạng thái đăng nhập) cho toàn ứng dụng
import { CungCapXacThuc } from "./ngu-canh/xac-thuc.jsx";
// Tệp CSS định kiểu giao diện chung cho toàn ứng dụng
import "./giao-dien.css";

// Tạo root React tại phần tử có id "root" rồi render cây component vào đó
ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode: bật kiểm tra phát triển nghiêm ngặt nhằm cảnh báo sớm các lỗi tiềm ẩn
  <React.StrictMode>
    {/* BrowserRouter: quản lý điều hướng trang; basename="/quan-ly" vì hệ thống quản trị chạy ở đường dẫn con /quan-ly */}
    <BrowserRouter basename="/quan-ly">
      {/* CungCapXacThuc: chia sẻ trạng thái đăng nhập cho toàn ứng dụng */}
      <CungCapXacThuc>
        <UngDung />
      </CungCapXacThuc>
    </BrowserRouter>
  </React.StrictMode>
);
