/*
 * vite.config.js
 * File cấu hình Vite cho phần frontend (React + Vite) của hệ thống quản lý cửa hàng dụng cụ thể thao.
 * Vai trò: khai báo plugin React và thiết lập dev server (cổng chạy, proxy gọi API tới backend)
 * khi phát triển ở môi trường local.
 */
// Import hàm defineConfig để khai báo cấu hình Vite (hỗ trợ gợi ý kiểu)
import { defineConfig } from "vite";
// Import plugin React của Vite (hỗ trợ JSX, Fast Refresh khi dev)
import react from "@vitejs/plugin-react";

// Cấu hình Vite cho dự án React
export default defineConfig({
  // Phục vụ ứng dụng quản trị tại đường dẫn con /quan-ly/ (mọi tài nguyên build nằm dưới /quan-ly/)
  base: "/quan-ly/",
  // Danh sách plugin: kích hoạt plugin React
  plugins: [react()],
  // Thiết lập cho dev server (chỉ áp dụng khi chạy npm run dev)
  server: {
    // Cổng chạy frontend ở môi trường local
    port: 5173,
    // Khi chạy LOCAL (npm run dev), chuyển tiếp /api sang backend ở cổng 5000
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
