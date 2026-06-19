// =============================================================================
// Bộ điều khiển NHÀ CUNG CẤP (thêm / sửa / xóa / xem)
// -----------------------------------------------------------------------------
// File này tập hợp các hàm xử lý (controller) cho nghiệp vụ quản lý nhà cung cấp.
// Mỗi hàm tương ứng với 1 route API; nhận request (req), trả response (res) dạng JSON.
// =============================================================================

// pool: nhóm kết nối MySQL dùng chung để truy vấn cơ sở dữ liệu
const { pool } = require("../cau-hinh/ket-noi-db");
// batLoi: hàm bọc controller bất đồng bộ để tự động bắt lỗi và chuyển cho middleware xử lý
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");
// Tiện ích ràng buộc: tên bắt buộc, định dạng email/SĐT
const { batBuoc, kiemTraEmail, kiemTraDienThoai } = require("../tien-ich/kiem-tra");

// [GET] /api/nha-cung-cap - Lấy danh sách nhà cung cấp
// Truy vấn toàn bộ nhà cung cấp, sắp xếp theo id giảm dần (mới nhất lên đầu)
const layDanhSach = batLoi(async (req, res) => {
  // Lấy toàn bộ bản ghi trong bảng nha_cung_cap, ORDER BY id DESC để bản ghi mới nhất hiện trước
  const [rows] = await pool.query("SELECT * FROM nha_cung_cap ORDER BY id DESC");
  // Trả về danh sách dưới dạng JSON kèm cờ thành công
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [POST] /api/nha-cung-cap - Thêm nhà cung cấp
// Tạo mới một nhà cung cấp từ dữ liệu gửi lên trong body
const them = batLoi(async (req, res) => {
  // Lấy các trường thông tin nhà cung cấp từ body request
  const { ten_ncc, dien_thoai, email, dia_chi } = req.body;
  // Ràng buộc: tên bắt buộc; SĐT/email (nếu nhập) phải đúng định dạng
  const tenNCC = batBuoc(ten_ncc, "Tên nhà cung cấp");
  const dt = kiemTraDienThoai(dien_thoai);
  const em = kiemTraEmail(email);
  // Thêm bản ghi mới; dùng tham số hóa (?) để chống SQL injection
  const [kq] = await pool.query(
    "INSERT INTO nha_cung_cap (ten_ncc, dien_thoai, email, dia_chi) VALUES (?, ?, ?, ?)",
    [tenNCC, dt, em, dia_chi || null]
  );
  // Trả về mã 201 (đã tạo) kèm id của bản ghi vừa thêm
  res.status(201).json({ thanh_cong: true, du_lieu: { id: kq.insertId } });
});

// [PUT] /api/nha-cung-cap/:id - Cập nhật nhà cung cấp
// Cập nhật thông tin nhà cung cấp theo id truyền trên đường dẫn (:id)
const capNhat = batLoi(async (req, res) => {
  // Lấy các trường cần cập nhật từ body request
  const { ten_ncc, dien_thoai, email, dia_chi } = req.body;
  // Ràng buộc giống khi thêm (trước đây khi SỬA không kiểm tra tên)
  const tenNCC = batBuoc(ten_ncc, "Tên nhà cung cấp");
  const dt = kiemTraDienThoai(dien_thoai);
  const em = kiemTraEmail(email);
  // Cập nhật bản ghi khớp id; các trường rỗng được lưu NULL, lọc theo req.params.id
  await pool.query(
    "UPDATE nha_cung_cap SET ten_ncc = ?, dien_thoai = ?, email = ?, dia_chi = ? WHERE id = ?",
    [tenNCC, dt, em, dia_chi || null, req.params.id]
  );
  // Trả về thông báo cập nhật thành công
  res.json({ thanh_cong: true, thong_bao: "Cập nhật nhà cung cấp thành công" });
});

// [DELETE] /api/nha-cung-cap/:id - Xóa nhà cung cấp
// Xóa nhà cung cấp theo id truyền trên đường dẫn (:id)
const xoa = batLoi(async (req, res) => {
  // Xóa bản ghi có id tương ứng trong bảng nha_cung_cap
  await pool.query("DELETE FROM nha_cung_cap WHERE id = ?", [req.params.id]);
  // Trả về thông báo xóa thành công
  res.json({ thanh_cong: true, thong_bao: "Xóa nhà cung cấp thành công" });
});

// Xuất các hàm controller để file định nghĩa route (router) sử dụng
module.exports = { layDanhSach, them, capNhat, xoa };
