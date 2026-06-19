// =============================================================================
// Phần mềm trung gian xử lý lỗi tập trung cho toàn bộ API
// Mọi lỗi phát sinh đều được chuyển về đây để trả thông báo thống nhất
// =============================================================================
// Middleware xử lý lỗi của Express: bắt buộc đủ 4 tham số (err, req, res, next)
// thì Express mới nhận diện đây là error-handling middleware
function xuLyLoi(err, req, res, next) {
  // Ghi log lỗi ra console phía máy chủ để tiện theo dõi/gỡ rối
  console.error("❌ Lỗi hệ thống:", err.message);

  // Lỗi ràng buộc khóa ngoại: cố xóa dữ liệu đang được dùng ở nơi khác
  // Mã lỗi do MySQL trả về khi bản ghi vẫn còn được tham chiếu bởi bảng khác
  if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
    // 409 Conflict: yêu cầu hợp lệ nhưng xung đột với trạng thái dữ liệu hiện tại
    return res
      .status(409)
      .json({ thanh_cong: false, thong_bao: "Không thể xóa vì dữ liệu đang được sử dụng ở nơi khác" });
  }

  // Lỗi trùng dữ liệu (vi phạm ràng buộc UNIQUE)
  // MySQL trả mã ER_DUP_ENTRY khi chèn/sửa giá trị đã tồn tại ở cột UNIQUE
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ thanh_cong: false, thong_bao: "Dữ liệu đã tồn tại (bị trùng)" });
  }

  // Các lỗi còn lại: dùng mã trạng thái err.status nếu có, nếu không mặc định 500
  // (500 Internal Server Error - lỗi máy chủ chưa được phân loại cụ thể)
  res.status(err.status || 500).json({
    thanh_cong: false,
    thong_bao: err.message || "Lỗi máy chủ nội bộ",
  });
}

// Xuất middleware để app.js đăng ký ở cuối chuỗi middleware (sau các route)
module.exports = xuLyLoi;
