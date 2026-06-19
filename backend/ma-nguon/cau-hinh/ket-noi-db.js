// =============================================================================
// Cấu hình kết nối cơ sở dữ liệu MySQL bằng connection pool
// =============================================================================
const mysql = require("mysql2/promise");

// Tạo pool kết nối - tái sử dụng các kết nối giúp tăng hiệu năng
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cuahang_the_thao",
  charset: "utf8mb4", // đảm bảo đọc/ghi tiếng Việt có dấu chính xác
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm thử kết nối CSDL, thử lại nhiều lần vì MySQL trong Docker khởi động khá chậm
// soLanThu: số lần thử tối đa; doTreMs: thời gian chờ (ms) giữa các lần thử
async function ketNoiCoSoDuLieu(soLanThu = 12, doTreMs = 3000) {
  // Lặp thử kết nối cho đến khi thành công hoặc hết số lần cho phép
  for (let lan = 1; lan <= soLanThu; lan++) {
    try {
      // Lấy 1 kết nối từ pool để kiểm tra MySQL đã sẵn sàng chưa
      const conn = await pool.getConnection();
      // ping kiểm tra kết nối còn sống, sau đó trả kết nối về pool
      await conn.ping();
      conn.release();
      console.log("✅ Đã kết nối cơ sở dữ liệu MySQL thành công");
      return;
    } catch (loi) {
      // Chưa kết nối được: ghi log và chờ doTreMs ms rồi thử lại ở vòng lặp sau
      console.log(`⏳ Đang chờ MySQL sẵn sàng... (lần ${lan}/${soLanThu})`);
      await new Promise((r) => setTimeout(r, doTreMs));
    }
  }
  // Hết số lần thử mà vẫn thất bại: ném lỗi để dừng tiến trình khởi động server
  throw new Error("❌ Không thể kết nối cơ sở dữ liệu sau nhiều lần thử");
}

// Xuất pool (để chạy truy vấn) và hàm kiểm tra kết nối cho các module khác dùng
module.exports = { pool, ketNoiCoSoDuLieu };
