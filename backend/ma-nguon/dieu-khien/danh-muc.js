// =============================================================================
// Bộ điều khiển DANH MỤC sản phẩm (thêm / sửa / xóa / xem)
// -----------------------------------------------------------------------------
// File này định nghĩa các hàm xử lý (controller) cho tài nguyên "danh mục".
// Mỗi hàm tương ứng với một route CRUD và trả về JSON theo định dạng chung:
//   { thanh_cong: boolean, du_lieu?/thong_bao? ... }
// =============================================================================

// Lấy pool kết nối MySQL dùng chung để thực thi truy vấn (async/await)
const { pool } = require("../cau-hinh/ket-noi-db");
// Hàm bọc (wrapper) bắt lỗi cho controller bất đồng bộ:
// tự động chuyển lỗi sang middleware xử lý lỗi, khỏi phải try/catch thủ công
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");
// Tiện ích ràng buộc: tên danh mục bắt buộc (không rỗng)
const { batBuoc } = require("../tien-ich/kiem-tra");

// [GET] /api/danh-muc - Lấy danh sách danh mục
// Trả về toàn bộ danh mục, sắp xếp theo id giảm dần (mới nhất lên đầu)
const layDanhSach = batLoi(async (req, res) => {
  // Truy vấn tất cả bản ghi; pool.query trả về mảng [rows, fields], lấy phần rows
  const [rows] = await pool.query("SELECT * FROM danh_muc ORDER BY id DESC");
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [POST] /api/danh-muc - Thêm danh mục mới
// Nhận dữ liệu từ body, kiểm tra hợp lệ rồi chèn bản ghi mới
const them = batLoi(async (req, res) => {
  // Lấy các trường cần thiết từ body của request
  const { ten_danh_muc, mo_ta } = req.body;
  // Kiểm tra bắt buộc: tên danh mục không được rỗng (kể cả chỉ gồm khoảng trắng)
  const tenDM = batBuoc(ten_danh_muc, "Tên danh mục");
  // Dùng tham số (?) để chống SQL injection; mo_ta nếu trống thì lưu NULL
  const [kq] = await pool.query(
    "INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES (?, ?)",
    [tenDM, mo_ta || null]
  );
  // Trả 201 (Created) kèm id của bản ghi vừa thêm (kq.insertId)
  res.status(201).json({ thanh_cong: true, du_lieu: { id: kq.insertId } });
});

// [PUT] /api/danh-muc/:id - Cập nhật danh mục
// Cập nhật tên và mô tả của danh mục theo id truyền trên đường dẫn
const capNhat = batLoi(async (req, res) => {
  // Lấy dữ liệu mới từ body
  const { ten_danh_muc, mo_ta } = req.body;
  // Ràng buộc: tên danh mục bắt buộc (trước đây khi SỬA không kiểm tra)
  const tenDM = batBuoc(ten_danh_muc, "Tên danh mục");
  // Cập nhật bản ghi khớp id (req.params.id); mo_ta trống -> NULL
  await pool.query("UPDATE danh_muc SET ten_danh_muc = ?, mo_ta = ? WHERE id = ?", [
    tenDM,
    mo_ta || null,
    req.params.id,
  ]);
  res.json({ thanh_cong: true, thong_bao: "Cập nhật danh mục thành công" });
});

// [DELETE] /api/danh-muc/:id - Xóa danh mục
// Xóa danh mục theo id truyền trên đường dẫn
const xoa = batLoi(async (req, res) => {
  // Xóa bản ghi khớp id (req.params.id)
  await pool.query("DELETE FROM danh_muc WHERE id = ?", [req.params.id]);
  res.json({ thanh_cong: true, thong_bao: "Xóa danh mục thành công" });
});

// Xuất các controller để router (định tuyến) gọi tới
module.exports = { layDanhSach, them, capNhat, xoa };
