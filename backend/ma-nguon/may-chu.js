// =============================================================================
// Điểm khởi chạy của Backend API (Node.js + Express)
// Vai trò: nạp cấu hình môi trường, khai báo middleware dùng chung, gắn các
// route nghiệp vụ, kết nối cơ sở dữ liệu và khởi động máy chủ HTTP.
// =============================================================================
// Nạp biến môi trường từ file .env vào process.env (PORT, thông tin DB...)
require("dotenv").config();
// Framework web để định nghĩa route và xử lý request/response
const express = require("express");
// Middleware cho phép chia sẻ tài nguyên giữa các nguồn gốc khác nhau (CORS)
const cors = require("cors");
// Tiện ích xử lý đường dẫn file/thư mục theo từng hệ điều hành
const path = require("path");

// Hàm thiết lập kết nối tới cơ sở dữ liệu MySQL
const { ketNoiCoSoDuLieu } = require("./cau-hinh/ket-noi-db");
// Các hàm khởi tạo dữ liệu mẫu: tài khoản quản trị và mật khẩu khách mặc định
const { taoTaiKhoanMacDinh, taoMatKhauKhachMacDinh } = require("./cau-hinh/du-lieu-mau");
// Tập hợp toàn bộ route nghiệp vụ của ứng dụng (gom từ thư mục tuyen-duong)
const apiRoutes = require("./tuyen-duong");
// Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng
const xuLyLoi = require("./trung-gian/xu-ly-loi");

// Tạo đối tượng ứng dụng Express
const app = express();

// ---------- Phần mềm trung gian dùng chung ----------
app.use(cors());            // cho phép frontend gọi API
app.use(express.json());    // đọc dữ liệu JSON từ body request

// Trang gốc: thông báo thân thiện (vì đây là API, không phải web giao diện)
app.get("/", (req, res) =>
  res.json({
    thanh_cong: true,
    thong_bao: "Đây là API backend của hệ thống quản lý cửa hàng dụng cụ thể thao.",
    huong_dan: "Giao diện web chạy tại http://localhost:8080 . Các API dùng tiền tố /api/...",
    kiem_tra: "/api/health",
  })
);

// Route kiểm tra "sức khỏe" của API
app.get("/api/health", (req, res) =>
  res.json({ thanh_cong: true, thong_bao: "API đang hoạt động bình thường" })
);

// Phục vụ ảnh do người dùng tải lên (công khai để thẻ <img> hiển thị được, không cần token)
app.use("/api/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Gắn toàn bộ route nghiệp vụ với tiền tố /api
app.use("/api", apiRoutes);

// Phần mềm trung gian xử lý lỗi (luôn đặt sau cùng)
app.use(xuLyLoi);

// Cổng lắng nghe lấy từ biến môi trường, mặc định 5000 nếu không cấu hình
const PORT = process.env.PORT || 5000;

// Hàm khởi động bất đồng bộ (IIFE): chạy ngay khi nạp file
// Trình tự: kết nối CSDL -> tạo tài khoản mặc định -> tạo mật khẩu khách -> lắng nghe cổng
(async () => {
  try {
    // Bảo đảm kết nối CSDL sẵn sàng trước khi nhận request
    await ketNoiCoSoDuLieu();
    // Tạo tài khoản quản trị mặc định nếu chưa tồn tại
    await taoTaiKhoanMacDinh();
    // Thiết lập mật khẩu mặc định cho tài khoản khách
    await taoMatKhauKhachMacDinh();
    // Mọi bước chuẩn bị thành công thì mới mở cổng phục vụ HTTP
    app.listen(PORT, () => console.log(`🚀 Backend đang chạy tại cổng ${PORT}`));
  } catch (e) {
    // Nếu bất kỳ bước khởi tạo nào thất bại: ghi log lỗi và thoát tiến trình
    console.error("Không thể khởi động backend:", e.message);
    process.exit(1);
  }
})();
