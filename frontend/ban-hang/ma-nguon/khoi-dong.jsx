/*
 * Điểm khởi chạy (entry point) của ứng dụng web bán hàng phía khách (frontend React).
 * Vai trò: gắn (mount) cây component React vào thẻ #root trong HTML và bọc ứng dụng
 * bằng các Provider ngữ cảnh (router, xác thực khách, giỏ hàng) cần thiết toàn cục.
 */
// Điểm khởi chạy web bán hàng
// Thư viện lõi React để xây dựng giao diện theo component
import React from "react";
// ReactDOM (bản client) cung cấp createRoot để render React vào DOM thật
import ReactDOM from "react-dom/client";
// BrowserRouter: bật định tuyến (routing) phía trình duyệt cho toàn ứng dụng
import { BrowserRouter } from "react-router-dom";
// Component gốc chứa toàn bộ trang/route của ứng dụng
import UngDung from "./ung-dung.jsx";
// Provider quản lý trạng thái giỏ hàng dùng chung toàn ứng dụng
import { CungCapGioHang } from "./ngu-canh/gio-hang.jsx";
// Provider quản lý trạng thái đăng nhập/xác thực của khách hàng
import { CungCapXacThucKhach } from "./ngu-canh/xac-thuc-khach.jsx";
// Nạp file CSS giao diện tổng để áp dụng style toàn cục
import "./giao-dien.css";

// Tạo root React tại phần tử có id="root" rồi render cây component vào đó
ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode: bật cảnh báo/kiểm tra phụ trong môi trường phát triển (không ảnh hưởng bản build)
  <React.StrictMode>
    {/* BrowserRouter bọc ngoài cùng để mọi component bên trong dùng được điều hướng/route */}
    <BrowserRouter>
      {/* Cung cấp ngữ cảnh xác thực khách: nằm ngoài giỏ hàng để giỏ hàng biết khách đang đăng nhập */}
      <CungCapXacThucKhach>
        {/* Cung cấp ngữ cảnh giỏ hàng cho toàn bộ ứng dụng */}
        <CungCapGioHang>
          {/* Component gốc chứa toàn bộ giao diện và các trang của ứng dụng */}
          <UngDung />
        </CungCapGioHang>
      </CungCapXacThucKhach>
    </BrowserRouter>
  </React.StrictMode>
);
