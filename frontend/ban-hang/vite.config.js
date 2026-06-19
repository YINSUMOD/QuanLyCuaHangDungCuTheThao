/*
 * File cấu hình Vite cho ứng dụng web bán hàng (frontend React).
 * Khai báo plugin React, cổng dev server và các proxy để chuyển tiếp
 * request từ frontend sang backend/dịch vụ ảnh, tránh lỗi CORS khi chạy local.
 */
// Hàm trợ giúp định nghĩa cấu hình Vite (giúp gợi ý kiểu dữ liệu khi viết code)
import { defineConfig } from "vite";
// Plugin hỗ trợ React (JSX, Fast Refresh khi đang phát triển)
import react from "@vitejs/plugin-react";

// Cấu hình Vite cho web bán hàng
export default defineConfig({
  // Web bán hàng phục vụ tại gốc tên miền "/"
  base: "/",
  // Kích hoạt plugin React để Vite biên dịch JSX và bật hot-reload
  plugins: [react()],
  // Cấu hình máy chủ dev khi chạy lệnh `npm run dev`
  server: {
    // Cổng chạy frontend ở môi trường phát triển
    port: 5174,
    // Cấu hình proxy: chuyển tiếp các đường dẫn nhất định sang dịch vụ backend
    proxy: {
      // Mọi request bắt đầu bằng /api được chuyển tới backend API (Node/Express) ở cổng 5000
      "/api": "http://localhost:5000",
      // Mọi request bắt đầu bằng /anh (ảnh sản phẩm) được chuyển tới dịch vụ ảnh ở cổng 8080
      "/anh": "http://localhost:8080",
    },
  },
});
